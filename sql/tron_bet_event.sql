
DROP DATABASE IF EXISTS `tron_bet_event`;
CREATE DATABASE `tron_bet_event`;
USE `tron_bet_event`;

create table `years_box`(
    bid int8 not null auto_increment primary key,
    addr char(34),
    num int UNSIGNED default 0,
    freeNum int UNSIGNED default 0,
    ltyNum int UNSIGNED default 0,
    UNIQUE KEY `box_addr` (`addr`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- 用户操作日志
create table `years_oprate_logs`(
    log_id int8 not null auto_increment primary key,
    addr char(34),
    types int comment '类型 => 1 : buy, 2 : sell, 3:exchange, 4: open box',
    num float,
    ts int8
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- 用户操作日志详情
create table `years_log_detail`(
    dt_id int8 not null auto_increment primary key,
    log_id int not null,
    gid int comment '箱子类型, 1 ~ 54',
    num int
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- 用户背包
create table `years_user_bag`(
    bag_id int8 not null auto_increment primary key,
    addr char(34),
    gid int comment '箱子类型, 1 ~ 54',
    num int UNSIGNED default 0,
    UNIQUE KEY `addr_gid` (`addr`,`gid`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- order
create table `years_block_order`(
    order_id int8 not null auto_increment primary key,
    addr char(34),
    block_id int8,
    num int,
    ts int8,
    UNIQUE KEY `addr_block_id` (`addr`,`block_id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

--payment
create table `years_pay2user`(
    pid int8 not null auto_increment primary key,
    addr char(34),
    tx_id char(130),
    amount int8,
    log_id int8,
    ts int8
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- 下注订单
create table `years_bet_order`(
    order_id int8 not null auto_increment primary key,
    addr char(34),
    bet_id int8,
    num int,
    ts int8,
    UNIQUE KEY `addr_bet_id` (`addr`,`bet_id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- 星光
create table `years_suit_score`(
    order_id int8 not null auto_increment primary key,
    round int,
    addr char(34),
    score int8,
    UNIQUE KEY `address_round` (`round`, `addr`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

create table `years_score_reward_log`(
    log_id int8 not null auto_increment primary key,
    round int,
    addr char(34),
    score int8,
    ante int,
    trx int,
    ts int8,
    status int default 0,
    tx_id char(130),
    UNIQUE KEY `address_round` (`round`, `addr`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

create table `years_lottery_log`(
    log_id int8 not null auto_increment primary key,
    addr char(34),
    ltyId int,
    types char(6),
    num bigint,
    txId char(64),
    ts bigint
)ENGINE=InnoDB DEFAULT CHARSET=utf8;



