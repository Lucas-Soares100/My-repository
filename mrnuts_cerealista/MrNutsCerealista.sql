-- Mr.Nuts Cerealista - Schema para Railway MySQL
-- IMPORTANTE: não usar CREATE DATABASE nem USE no Railway.
-- Rode este script dentro do banco padrão do Railway, geralmente MYSQLDATABASE=railway.

CREATE TABLE IF NOT EXISTS adm (
  ra INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  img VARCHAR(255) NULL,
  telefone VARCHAR(15) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fornecedor (
  id_fornecedor INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  img VARCHAR(255) NULL,
  password VARCHAR(255) NOT NULL,
  reputacao INT DEFAULT 0,
  seguidores INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cliente (
  idc INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  img VARCHAR(255) NULL,
  telefone VARCHAR(15) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produtos (
  Cod_produto INT PRIMARY KEY AUTO_INCREMENT,
  Titulo TEXT NOT NULL,
  Link VARCHAR(500) NULL,
  Descricao TEXT,
  Categoria ENUM('nozes','castanhas','grãos','sementes','farináceos','chips','temperos') NOT NULL,
  Preco DECIMAL(10,2) DEFAULT NULL,
  img_capa VARCHAR(255) NULL,
  img_galeria JSON NULL,
  id_fornecedor INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_fornecedor) REFERENCES fornecedor(id_fornecedor)
);

CREATE TABLE IF NOT EXISTS avaliacoes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  produto_id INT NOT NULL,
  cliente_id INT NOT NULL,
  nota DECIMAL(2,1) NOT NULL,
  comentario TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seguidores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  fornecedor_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cliente_id, fornecedor_id),
  FOREIGN KEY (cliente_id) REFERENCES cliente(idc) ON DELETE CASCADE,
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedor(id_fornecedor) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favoritos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  produto_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cliente_id, produto_id),
  FOREIGN KEY (cliente_id) REFERENCES cliente(idc) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(Cod_produto) ON DELETE CASCADE
);
