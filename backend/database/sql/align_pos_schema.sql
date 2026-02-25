CREATE TABLE IF NOT EXISTS `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tables` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `token` VARCHAR(100) NOT NULL,
  `capacity` INT UNSIGNED NOT NULL DEFAULT 1,
  `status` ENUM('available','occupied','reserved') NOT NULL DEFAULT 'available',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tables_name_unique` (`name`),
  UNIQUE KEY `tables_token_unique` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `category_id` BIGINT UNSIGNED NULL AFTER `id`,
  ADD COLUMN IF NOT EXISTS `price_small` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `name`,
  ADD COLUMN IF NOT EXISTS `price_medium` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `price_small`,
  ADD COLUMN IF NOT EXISTS `price_large` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `price_medium`,
  ADD COLUMN IF NOT EXISTS `is_available` TINYINT(1) NOT NULL DEFAULT 1 AFTER `image`;

UPDATE `products`
SET
  `price_small` = IFNULL(`price_small`, `price`),
  `price_medium` = IFNULL(`price_medium`, `price`),
  `price_large` = IFNULL(`price_large`, `price`),
  `is_available` = IFNULL(`is_available`, `status`);

ALTER TABLE `products`
  ADD KEY `products_category_id_index` (`category_id`);

SET @products_fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND CONSTRAINT_NAME = 'products_category_id_foreign'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @products_fk_sql := IF(@products_fk_exists = 0,
  'ALTER TABLE `products` ADD CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt_products_fk FROM @products_fk_sql;
EXECUTE stmt_products_fk;
DEALLOCATE PREPARE stmt_products_fk;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `table_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('pending','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'pending',
  `total_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_type` ENUM('cash','khqr') NOT NULL,
  `queue_number` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `orders_table_id_index` (`table_id`),
  KEY `orders_status_index` (`status`),
  KEY `orders_created_at_index` (`created_at`),
  CONSTRAINT `orders_table_id_foreign` FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `size` ENUM('small','medium','large') NOT NULL,
  `qty` INT UNSIGNED NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_index` (`order_id`),
  KEY `order_items_product_id_index` (`product_id`),
  CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ingredients` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `unit` VARCHAR(20) NOT NULL,
  `stock_qty` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `min_stock` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ingredients_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `recipes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `ingredient_id` BIGINT UNSIGNED NOT NULL,
  `amount_small` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `amount_medium` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `amount_large` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `recipes_product_ingredient_unique` (`product_id`,`ingredient_id`),
  KEY `recipes_ingredient_id_index` (`ingredient_id`),
  CONSTRAINT `recipes_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `recipes_ingredient_id_foreign` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `expenses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `category` ENUM('ingredients','utilities','salary','rent','other') NOT NULL DEFAULT 'other',
  `date` DATE NOT NULL,
  `note` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `expenses_date_index` (`date`),
  KEY `expenses_category_index` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `purchases` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ingredient_id` BIGINT UNSIGNED NOT NULL,
  `qty` DECIMAL(10,2) NOT NULL,
  `cost` DECIMAL(10,2) NOT NULL,
  `date` DATE NOT NULL,
  `note` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `purchases_ingredient_id_index` (`ingredient_id`),
  KEY `purchases_date_index` (`date`),
  CONSTRAINT `purchases_ingredient_id_foreign` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `role` ENUM('admin','staff') NOT NULL DEFAULT 'staff' AFTER `password`,
  ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `role`;
