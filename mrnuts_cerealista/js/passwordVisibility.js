// ═══════════════════════════════════════════════════════════════════════════
// PASSWORD VISIBILITY + CONFIRMAÇÃO DE SENHA
// Mr.Nuts_Cerealista - JS puro, compatível com SPA e formulários dinâmicos
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  const styleId = 'password-visibility-style'

  function injectStyles() {
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .password-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
      }

      .password-input-wrapper input {
        width: 100%;
        padding-right: 2.75rem !important;
      }

      .toggle-password {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        background: none !important;
        border: none !important;
        cursor: pointer;
        color: #888;
        font-size: 1rem;
        padding: 0;
        width: 1.5rem;
        height: 1.5rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: none !important;
      }

      .toggle-password:hover {
        color: var(--color-primary, var(--primary-color, #8B4513));
      }
    `
    document.head.appendChild(style)
  }

  function notifyPasswordError(message) {
    if (window.notify?.error) {
      window.notify.error(message)
      return
    }
    alert(message)
  }

  function wrapPasswordInput(input) {
    if (!input || input.dataset.pwEnhanced === 'true') return

    input.dataset.pwEnhanced = 'true'
    input.dataset.passwordField = 'true'

    let wrapper = input.closest('.password-input-wrapper')
    if (!wrapper) {
      wrapper = document.createElement('div')
      wrapper.className = 'password-input-wrapper'
      input.parentNode.insertBefore(wrapper, input)
      wrapper.appendChild(input)
    }

    if (wrapper.querySelector('.toggle-password')) return

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'toggle-password'
    button.setAttribute('aria-label', 'Mostrar senha')
    button.textContent = '👁️'

    button.addEventListener('click', () => {
      const visible = input.type === 'text'
      input.type = visible ? 'password' : 'text'
      button.setAttribute('aria-label', visible ? 'Mostrar senha' : 'Ocultar senha')
      button.textContent = visible ? '👁️' : '🙈'
    })

    wrapper.appendChild(button)
  }

  function enhancePasswordFields(root = document) {
    injectStyles()

    root.querySelectorAll('input[type="password"], input[data-password-field="true"]').forEach(wrapPasswordInput)
    ensureRegisterConfirmFields(root)
    ensureAdminCreateConfirmField(root)
  }

  function insertConfirmAfter(passwordInput, confirmId, labelText = 'Confirmar Senha') {
    if (!passwordInput || document.getElementById(confirmId)) return

    const passwordGroup = passwordInput.closest('.form-group') || passwordInput.parentElement
    const confirmGroup = document.createElement('div')
    confirmGroup.className = 'form-group'
    confirmGroup.innerHTML = `
      <label>${labelText}</label>
      <input type="password" id="${confirmId}" required minlength="6" autocomplete="new-password">
    `

    passwordGroup.insertAdjacentElement('afterend', confirmGroup)
    wrapPasswordInput(confirmGroup.querySelector('input'))
  }

  function ensureRegisterConfirmFields(root = document) {
    insertConfirmAfter(
      root.querySelector('#register-client-password') || document.getElementById('register-client-password'),
      'register-client-password-confirm'
    )

    insertConfirmAfter(
      root.querySelector('#register-supplier-password') || document.getElementById('register-supplier-password'),
      'register-supplier-password-confirm'
    )

    // ADM já possui passwordConfirm, mas a função abaixo só adiciona caso algum HTML antigo não tenha.
    insertConfirmAfter(
      root.querySelector('#password') || document.getElementById('password'),
      'passwordConfirm'
    )
  }

  function ensureAdminCreateConfirmField(root = document) {
    const modalTitle = document.getElementById('modalTitle')?.textContent?.toLowerCase() || ''
    const isCreateProfile = modalTitle.includes('novo cliente') || modalTitle.includes('novo fornecedor')
    if (!isCreateProfile) return

    insertConfirmAfter(
      root.querySelector('#editPassword') || document.getElementById('editPassword'),
      'editPasswordConfirm'
    )
  }

  function getPairFromForm(form) {
    const pairs = [
      ['#register-client-password', '#register-client-password-confirm'],
      ['#register-supplier-password', '#register-supplier-password-confirm'],
      ['#password', '#passwordConfirm'],
      ['#editPassword', '#editPasswordConfirm']
    ]

    for (const [passwordSelector, confirmSelector] of pairs) {
      const password = form.querySelector(passwordSelector)
      const confirm = form.querySelector(confirmSelector)
      if (password && confirm) return { password, confirm }
    }

    return null
  }

  function validatePair(password, confirm) {
    if (!password || !confirm) return true

    if (password.value.length < 6) {
      notifyPasswordError('Senha deve ter no mínimo 6 caracteres')
      password.focus()
      return false
    }

    if (password.value !== confirm.value) {
      notifyPasswordError('As senhas não correspondem')
      confirm.focus()
      return false
    }

    return true
  }

  function setupValidationGuards() {
    document.addEventListener('submit', event => {
      const form = event.target
      const pair = getPairFromForm(form)
      if (!pair) return

      if (!validatePair(pair.password, pair.confirm)) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }, true)

    // Protege o modal do admin-dashboard.js, que salva via clique e não via submit.
    document.addEventListener('click', event => {
      const button = event.target.closest('#saveEditBtn')
      if (!button) return

      const password = document.getElementById('editPassword')
      const confirm = document.getElementById('editPasswordConfirm')
      if (!password || !confirm) return

      if (!validatePair(password, confirm)) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }, true)
  }

  window.enhancePasswordFields = enhancePasswordFields

  document.addEventListener('DOMContentLoaded', () => {
    enhancePasswordFields()
    setupValidationGuards()

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) enhancePasswordFields(node)
        })
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
  })
})()
