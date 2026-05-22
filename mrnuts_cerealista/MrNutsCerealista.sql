create table adm(
	ra int primary key auto_increment,
	name varchar(255) not null unique,
	email varchar(255) not null unique,
    img varchar (255) null,
    telefone varchar(15) not null,
    password varchar(255) not null,
	created_at timestamp default current_timestamp
);

create table fornecedor(
	id_fornecedor int primary key auto_increment,
	name varchar(255) not null,
    cnpj varchar(255) not null unique,
	email varchar(255) not null unique,
    img varchar (255) null,
	password varchar(255) not null,
    reputacao INT DEFAULT 0,
    seguidores INT DEFAULT 0,
	created_at timestamp default current_timestamp
);

create table cliente(
	idc int primary key auto_increment,
	name varchar(255) not null,
	email varchar(255) not null unique,
    img varchar (255) null,
    telefone varchar(15) not null,
	password varchar(255) not null,
	created_at timestamp default current_timestamp
);

CREATE TABLE produtos (
    Cod_produto INT PRIMARY KEY AUTO_INCREMENT,
    Titulo TEXT NOT NULL,
    Link VARCHAR(500) NULL,
    Descricao TEXT,
    Categoria ENUM(
        'nozes', 
        'castanhas', 
        'grãos', 
        'sementes', 
        'farináceos', 
        'chips', 
        'temperos'
    ) NOT NULL,
    Preco DECIMAL(10,2) DEFAULT NULL,
    img_capa VARCHAR(255) NULL,
    img_galeria JSON NULL,
    id_fornecedor INT NOT NULL,                                
    FOREIGN KEY (id_fornecedor) REFERENCES fornecedor(id_fornecedor),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    cliente_id    INT NOT NULL,
    fornecedor_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cliente_id, fornecedor_id),
    FOREIGN KEY (cliente_id)    REFERENCES cliente(idc)              ON DELETE CASCADE,
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


--                     SELECTS E INSERTS
-- INSERT INTO adm (name, email, telefone, password) VALUES ("Raimundo da Silva","raimundo.silva@admin.mrnutscom","40028922", "1983");
-- INSERT INTO cliente (name, email, telefone, password) VALUES ("MrCereais","mrcereais@cliente.mrnutscom","995840085", "1985");
-- INSERT INTO fornecedor (name, cnpj, email, password) VALUES ("YouFood", "25492685000169","raimundosilva@fornecedor.mrnutscom", "1987");
select * from adm;
select * from fornecedor;
select * from cliente;
select * from produtos;
select * from avaliacoes;
select * from seguidores;
select * from favoritos;
SELECT id_fornecedor, name, cnpj, email, img, reputacao, seguidores, created_at FROM fornecedor;