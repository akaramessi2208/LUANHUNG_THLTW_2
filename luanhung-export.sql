

CREATE DATABASE IF NOT EXISTS `test`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Database thltw-bahung-24f voi 14 bang nhu cot ben trai phpMyAdmin

CREATE DATABASE IF NOT EXISTS `thltw-luanhung-24f`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `thltw-luanhung-24f`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `brands`;
CREATE TABLE `brands` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `image` varchar(2048) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brands_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(2048) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_unique` (`slug`),
  KEY `categories_parent_id_index` (`parent_id`),
  CONSTRAINT `categories_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `configs`;
CREATE TABLE `configs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `contacts`;
CREATE TABLE `contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `links`;
CREATE TABLE `links` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `order_details`;
CREATE TABLE `order_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `pages`;
CREATE TABLE `pages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) DEFAULT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `sale_price` decimal(12,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(2048) DEFAULT NULL,
  `qty` int(11) NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_slug_unique` (`slug`),
  KEY `products_category_id_index` (`category_id`),
  KEY `products_brand_id_index` (`brand_id`),
  CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_brand_id_foreign` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `topics`;
CREATE TABLE `topics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO `brands` (`name`, `slug`, `sort_order`, `status`) VALUES
  ('Frame Works', 'frame-works', 1, 1),
  ('Orbit Forge', 'orbit-forge', 2, 1),
  ('Nova Assembly', 'nova-assembly', 3, 1);

INSERT INTO `categories` (`name`, `slug`, `sort_order`, `status`) VALUES
  ('Mô hình lắp ráp', 'mo-hinh-lap-rap', 1, 1),
  ('Robot chiến đấu', 'robot-chien-dau', 2, 1),
  ('Diorama & trưng bày', 'diorama-trung-bay', 3, 1),
  ('Nhân vật & phi công', 'nhan-vat-phi-cong', 4, 1),
  ('Phụ kiện mô hình', 'phu-kien-mo-hinh', 5, 1),
  ('Dụng cụ lắp ráp', 'dung-cu-lap-rap', 6, 1);

INSERT INTO `products`
  (`category_id`, `brand_id`, `name`, `slug`, `price`, `sale_price`, `image`, `qty`, `description`, `status`)
VALUES
  ((SELECT `id` FROM `categories` WHERE `slug` = 'mo-hinh-lap-rap'), (SELECT `id` FROM `brands` WHERE `slug` = 'frame-works'), 'Astra Scout Frame 1/144', 'astra-scout-frame-144', 590000, 520000, '/images/mecha-aster.svg', 24, 'Mô hình robot trinh sát tỉ lệ 1/144 với giáp xanh ngọc, khớp linh hoạt và bộ phụ kiện tay thay thế. Sản phẩm lắp ráp, chưa sơn.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'robot-chien-dau'), (SELECT `id` FROM `brands` WHERE `slug` = 'orbit-forge'), 'Orion Vanguard Frame 1/100', 'orion-vanguard-frame-100', 1490000, NULL, '/images/mecha-orion.svg', 18, 'Khung robot chiến đấu tỉ lệ 1/100 với giáp xanh cobalt, khớp tạo dáng và khiên trưng bày. Sản phẩm lắp ráp, chưa sơn.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'robot-chien-dau'), (SELECT `id` FROM `brands` WHERE `slug` = 'nova-assembly'), 'Crimson Striker Unit', 'crimson-striker-unit', 1290000, 1150000, '/images/mecha-crimson.svg', 12, 'Mẫu mecha cơ động màu đỏ cam, kèm hai lưỡi năng lượng và đế tạo dáng. Sản phẩm lắp ráp, chưa sơn.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'mo-hinh-lap-rap'), (SELECT `id` FROM `brands` WHERE `slug` = 'frame-works'), 'Aegis Guardian Frame', 'aegis-guardian-frame', 1690000, NULL, '/images/mecha-aegis.svg', 20, 'Robot hộ vệ giáp trắng ngọc trai với khiên lớn và các khớp chuyển động. Sản phẩm lắp ráp, chưa sơn.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'robot-chien-dau'), (SELECT `id` FROM `brands` WHERE `slug` = 'orbit-forge'), 'Titan Heavy Armor Unit', 'titan-heavy-armor-unit', 1890000, 1750000, '/images/mecha-titan.svg', 35, 'Mô hình robot hạng nặng với giáp vai mở rộng, ba lô động cơ và phụ kiện vũ khí. Sản phẩm lắp ráp, chưa sơn.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'nhan-vat-phi-cong'), (SELECT `id` FROM `brands` WHERE `slug` = 'nova-assembly'), 'Pico Mini Mecha Chibi', 'pico-mini-mecha-chibi', 390000, NULL, '/images/mecha-pico.svg', 35, 'Robot mini phong cách dễ thương, ít chi tiết, phù hợp làm quen với mô hình lắp ráp.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'nhan-vat-phi-cong'), (SELECT `id` FROM `brands` WHERE `slug` = 'frame-works'), 'Frontier Pilot & Pod', 'frontier-pilot-pod', 450000, 410000, '/images/mecha-pilot.svg', 16, 'Buồng lái trưng bày cùng nhân vật phi công nguyên bản và bảng điều khiển chi tiết.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'diorama-trung-bay'), (SELECT `id` FROM `brands` WHERE `slug` = 'orbit-forge'), 'Hangar Display Base', 'hangar-display-base', 650000, NULL, '/images/mecha-hangar.svg', 20, 'Đế trưng bày dạng nhà chứa máy bay không gian, có sàn kỹ thuật và bảng tên tùy chỉnh.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'phu-kien-mo-hinh'), (SELECT `id` FROM `brands` WHERE `slug` = 'nova-assembly'), 'Astra Weapon Pack', 'astra-weapon-pack', 290000, NULL, '/images/mecha-parts.svg', 35, 'Bộ phụ kiện gồm kiếm, khiên nhỏ, bàn tay thay thế và khớp nối tương thích với dòng Frame.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'dung-cu-lap-rap'), (SELECT `id` FROM `brands` WHERE `slug` = 'frame-works'), 'Model Craft Tool Set', 'model-craft-tool-set', 340000, 310000, '/images/mecha-tools.svg', 16, 'Bộ dụng cụ cơ bản cho người chơi mô hình: kìm cắt, dũa mịn và nhíp gắp chi tiết.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'phu-kien-mo-hinh'), (SELECT `id` FROM `brands` WHERE `slug` = 'orbit-forge'), 'Nova Core LED Kit', 'nova-core-led-kit', 220000, NULL, '/images/mecha-led.svg', 24, 'Bộ đèn LED mini cho buồng lái và đế trưng bày; cần tự lắp pin theo hướng dẫn.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'dung-cu-lap-rap'), (SELECT `id` FROM `brands` WHERE `slug` = 'nova-assembly'), 'Panel Line & Decal Kit', 'panel-line-decal-kit', 180000, NULL, '/images/mecha-decals.svg', 18, 'Bộ bút tạo đường panel và decal họa tiết nguyên bản giúp hoàn thiện mô hình.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'mo-hinh-lap-rap'), (SELECT `id` FROM `brands` WHERE `slug` = 'frame-works'), 'Bộ khung nhựa robot nhiều màu', 'multicolor-robot-sprue-kit', 630000, NULL, '/images/gunpla-color-sprues.jpg', 15, 'Bộ chi tiết nhựa nhiều màu trên khung, phù hợp để lắp thành mô hình robot.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'mo-hinh-lap-rap'), (SELECT `id` FROM `brands` WHERE `slug` = 'orbit-forge'), 'Bộ khung xương robot lắp ráp', 'mecha-inner-frame-kit', 720000, NULL, '/images/gunpla-plastic-types.jpg', 20, 'Bộ khung trong và các chi tiết khớp robot dạng nhựa lắp rời.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'mo-hinh-lap-rap'), (SELECT `id` FROM `brands` WHERE `slug` = 'nova-assembly'), 'Bộ giáp robot trên khung nhựa', 'robot-armor-sprue-kit', 540000, NULL, '/images/gunpla-body-sprues.jpg', 16, 'Bộ chi tiết giáp robot còn trên khung nhựa, cần lắp ráp hoàn thiện.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'mo-hinh-lap-rap'), (SELECT `id` FROM `brands` WHERE `slug` = 'frame-works'), 'Hộp mô hình robot kèm decal', 'robot-kit-with-decals', 990000, NULL, '/images/gunpla-model-packed.jpg', 10, 'Bộ mô hình robot đóng hộp cùng các chi tiết lắp ráp và decal trang trí.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'dung-cu-lap-rap'), (SELECT `id` FROM `brands` WHERE `slug` = 'orbit-forge'), 'Kìm cắt khung nhựa mô hình', 'model-sprue-cutter', 185000, NULL, '/images/gunpla-sprue-cutter.jpg', 28, 'Kìm cắt chuyên dụng để tách chi tiết mô hình khỏi khung nhựa.', 1),
  ((SELECT `id` FROM `categories` WHERE `slug` = 'phu-kien-mo-hinh'), (SELECT `id` FROM `brands` WHERE `slug` = 'nova-assembly'), 'Bộ chi tiết khớp nối robot', 'robot-joint-parts-set', 260000, NULL, '/images/gunpla-parts.jpg', 22, 'Bộ chi tiết nhựa và khớp nối thay thế cho mô hình robot lắp ráp.', 1);
