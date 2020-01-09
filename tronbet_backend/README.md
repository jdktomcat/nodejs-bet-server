create table user(
    id int not null auto_increment primary key,
    username varchar(64),
    passwd varchar(64),
    role int default 0
);


create table update_notice(
    id int not null auto_increment primary key,
    title varchar(128),
    content text,
    language varchar(10),
    update_time int
);

insert into user(username, passwd) values ('Sam','f979f69b1f065ad9bad434df66ccc48a7e87e9ca6026746e910e7a653746851e');
insert into user(username, passwd) values ('Wangman','3e08e97372cfda36e111716e95499c4a64cd3bb5a47338d164ae85e919ed3261');
insert into user(username, passwd) values ('openuser1','1ef541888929c1bfcabf49c84978608e38d645226405389d5cef51ea448ed588');
insert into user(username, passwd) values ('boss1','9772f50ed9da2fcd87f069432b6d785882b62b141a6a1ff9f612d6eae8f9cba1');
insert into user(username, passwd) values ('Rick','3f62aa847d93add0da54e736318e164364f02fffa562d525282d0c311b36c5e5');
insert into user(username, passwd) values ('Eunice','d4e808cb011f6e20e645ba364befdd7a15f6c14b131d9d3a4b4f7ab01b2c9b54');
insert into user(username, passwd) values ('BossWen','a562ddc0a0874807eb2a4561afce5db0d7b3a4d9f2526999e72421914907ffdc');
insert into user(username, passwd, role) values ('openuser2','7096b47ea6f2cf4fe0de877fdb561e75dc4475de407e5d57d8d18aac6ad0607f', 1);

insert into user(username, passwd, role) values ('Trontouzibu','40754039ee2b7831184ebb4d877f454db6ea8f900a07a93ccb58e65b057ad2f5', 0);
insert into user(username, passwd, role) values ('Tronchanpinbu','fb9ef894175c327470f768d95ca7bee65e19853a0eaace3805f8a7b8a12270da', 3);
insert into user(username, passwd, role) values ('Tronyunyingbu','0f044feb6ca7d6764650e6b800425a84b5ea518d6f531ee92c3995d6c3eca11e', 2);


openuser1/Tronbet@open123



-- 用户操作日志
create table `chris_box`(
    bid int8 not null auto_increment primary key,
    addr char(34),
    num int,
    UNIQUE KEY `box_addr` (`addr`)
);


-- 用户操作日志
create table `chris_oprate_logs`(
    log_id int8 not null auto_increment primary key,
    addr char(34),
    types int comment '类型 => 1 : buy, 2 : sell, 3:exchange, 4: open box',
    num float,
    ts int8
);

-- 用户操作日志详情
create table `chris_log_detail`(
    dt_id int8 not null auto_increment primary key,
    log_id int not null,
    gid int comment '箱子类型, 1 ~ 10',
    num int
);

-- 用户背包
create table `chris_user_bag`(
    bag_id int8 not null auto_increment primary key,
    addr char(34),
    gid int comment '箱子类型, 1 ~ 10',
    num int,
    UNIQUE KEY `addr_gid` (`addr`,`gid`)
);

-- order
create table `chris_block_order`(
    order_id int8 not null auto_increment primary key,
    addr char(34),
    block_id int8,
    num int,
    ts int8,
    UNIQUE KEY `addr_block_id` (`addr`,`block_id`)
);

--payment
create table `pay2user`(
    pid int8 not null auto_increment primary key,
    addr char(34),
    tx_id char(130),
    amount int8,
    log_id int8,
    ts int8
);

-- 下注订单
create table `chris_bet_order`(
    order_id int8 not null auto_increment primary key,
    addr char(34),
    bet_id int8,
    num int,
    ts int8,
    UNIQUE KEY `addr_bet_id` (`addr`,`bet_id`)
);

-- 星光

create table `chris_suit_score`(
    order_id int8 not null auto_increment primary key,
    addr char(34),
    score int8,
    UNIQUE KEY `address` (`addr`)
);



create table `ante_send_logs`(
    id int8 not null auto_increment primary key,
    addr char(34),
    amont int8, 
    tx_id char(130), 
    balance int8 default 0,
    status int,
    UNIQUE KEY `ante_send_logs_id` (`addr`)
);