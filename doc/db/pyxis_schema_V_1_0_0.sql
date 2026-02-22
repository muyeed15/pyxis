-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Feb 09, 2026 at 01:08 PM
-- Server version: 8.0.45-0ubuntu0.24.04.1
-- PHP Version: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pyxis_schema`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookmarks`
--

CREATE TABLE `bookmarks` (
  `uuid` varchar(255) NOT NULL,
  `id` int NOT NULL,
  `user_uuid` varchar(255) NOT NULL,
  `group_uuid` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `url` longtext NOT NULL,
  `icon_url` longtext NOT NULL,
  `keywords` varchar(255) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

CREATE TABLE `groups` (
  `uuid` varchar(255) NOT NULL,
  `id` int NOT NULL,
  `creator_uuid` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `icon` varchar(255) NOT NULL,
  `share_code` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `histories`
--

CREATE TABLE `histories` (
  `uuid` varchar(255) NOT NULL,
  `id` int NOT NULL,
  `user_uuid` varchar(255) NOT NULL,
  `search_uuid` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `url` longtext NOT NULL,
  `icon_url` longtext NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invites`
--

CREATE TABLE `invites` (
  `uuid` varchar(255) NOT NULL,
  `id` int NOT NULL,
  `sender_uuid` varchar(255) NOT NULL,
  `receiver_uuid` varchar(255) NOT NULL,
  `type` enum('group') NOT NULL,
  `status` enum('pending','accepted','declined') NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

CREATE TABLE `logs` (
  `uuid` varchar(255) NOT NULL,
  `id` int NOT NULL,
  `user_uuid` varchar(255) DEFAULT NULL,
  `type` enum('access','group','system') NOT NULL,
  `details` json NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `members`
--

CREATE TABLE `members` (
  `uuid` varchar(255) NOT NULL,
  `id` int NOT NULL,
  `user_uuid` varchar(255) NOT NULL,
  `group_uuid` varchar(255) NOT NULL,
  `role` enum('admin','member') NOT NULL,
  `status` enum('pending','active','removed') NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `uuid` varchar(255) NOT NULL,
  `id` int NOT NULL,
  `sender_uuid` varchar(255) DEFAULT NULL,
  `receiver_uuid` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` varchar(255) NOT NULL,
  `action_url` longtext NOT NULL,
  `is_read` tinyint(1) NOT NULL,
  `type` enum('system','invite','group') NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `searches`
--

CREATE TABLE `searches` (
  `uuid` varchar(255) NOT NULL,
  `id` int NOT NULL,
  `user_uuid` varchar(255) NOT NULL,
  `query` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `uuid` varchar(255) NOT NULL,
  `id` int NOT NULL,
  `user_uuid` varchar(255) NOT NULL,
  `preferences` json NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `uuid` varchar(255) NOT NULL,
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `dob` date NOT NULL,
  `country` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','client') NOT NULL,
  `status` enum('active','inactive','suspended') NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookmarks`
--
ALTER TABLE `bookmarks`
  ADD PRIMARY KEY (`uuid`),
  ADD UNIQUE KEY `uuid_UNIQUE` (`uuid`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`),
  ADD UNIQUE KEY `sort_order_UNIQUE` (`sort_order`),
  ADD KEY `bookmark_user_fk_idx` (`user_uuid`),
  ADD KEY `bookmark_group_fk_idx` (`group_uuid`);

--
-- Indexes for table `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`uuid`),
  ADD UNIQUE KEY `uuid_UNIQUE` (`uuid`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`),
  ADD KEY `group_user_fk_idx` (`creator_uuid`);

--
-- Indexes for table `histories`
--
ALTER TABLE `histories`
  ADD PRIMARY KEY (`uuid`),
  ADD UNIQUE KEY `uuid_UNIQUE` (`uuid`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`),
  ADD KEY `history_search_fk_idx` (`search_uuid`),
  ADD KEY `history_user_fk_idx` (`user_uuid`);

--
-- Indexes for table `invites`
--
ALTER TABLE `invites`
  ADD PRIMARY KEY (`uuid`),
  ADD UNIQUE KEY `uuid_UNIQUE` (`uuid`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`),
  ADD KEY `invite_sender_fk_idx` (`sender_uuid`),
  ADD KEY `invite_reciever_fk_idx` (`receiver_uuid`);

--
-- Indexes for table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`uuid`),
  ADD UNIQUE KEY `uuid_UNIQUE` (`uuid`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`),
  ADD KEY `log_user_fk_idx` (`user_uuid`);

--
-- Indexes for table `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`uuid`),
  ADD UNIQUE KEY `uuid_UNIQUE` (`uuid`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`),
  ADD KEY `member_user_idx` (`user_uuid`),
  ADD KEY `member_group_idx` (`group_uuid`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`uuid`),
  ADD UNIQUE KEY `uuid_UNIQUE` (`uuid`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`),
  ADD KEY `notification_sender_fk_idx` (`sender_uuid`),
  ADD KEY `notification_reciever_fk_idx` (`receiver_uuid`);

--
-- Indexes for table `searches`
--
ALTER TABLE `searches`
  ADD PRIMARY KEY (`uuid`),
  ADD UNIQUE KEY `uuid_UNIQUE` (`uuid`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`),
  ADD KEY `user_uuid_idx` (`user_uuid`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`uuid`),
  ADD UNIQUE KEY `uuid_UNIQUE` (`uuid`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`),
  ADD KEY `user_uuid_idx` (`user_uuid`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`uuid`),
  ADD UNIQUE KEY `uuid_UNIQUE` (`uuid`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`),
  ADD UNIQUE KEY `email_UNIQUE` (`email`),
  ADD UNIQUE KEY `phone_UNIQUE` (`phone`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookmarks`
--
ALTER TABLE `bookmarks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `groups`
--
ALTER TABLE `groups`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `histories`
--
ALTER TABLE `histories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invites`
--
ALTER TABLE `invites`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `members`
--
ALTER TABLE `members`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `searches`
--
ALTER TABLE `searches`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookmarks`
--
ALTER TABLE `bookmarks`
  ADD CONSTRAINT `bookmark_group_fk` FOREIGN KEY (`group_uuid`) REFERENCES `groups` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `bookmark_user_fk` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `groups`
--
ALTER TABLE `groups`
  ADD CONSTRAINT `group_user_fk` FOREIGN KEY (`creator_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `histories`
--
ALTER TABLE `histories`
  ADD CONSTRAINT `history_search_fk` FOREIGN KEY (`search_uuid`) REFERENCES `searches` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `history_user_fk` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `invites`
--
ALTER TABLE `invites`
  ADD CONSTRAINT `invite_reciever_fk` FOREIGN KEY (`receiver_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `invite_sender_fk` FOREIGN KEY (`sender_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `logs`
--
ALTER TABLE `logs`
  ADD CONSTRAINT `log_user_fk` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `members`
--
ALTER TABLE `members`
  ADD CONSTRAINT `member_group` FOREIGN KEY (`group_uuid`) REFERENCES `groups` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `member_user` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notification_reciever_fk` FOREIGN KEY (`receiver_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `notification_sender_fk` FOREIGN KEY (`sender_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `searches`
--
ALTER TABLE `searches`
  ADD CONSTRAINT `search_user_fk` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `settings`
--
ALTER TABLE `settings`
  ADD CONSTRAINT `setting_user_fk` FOREIGN KEY (`user_uuid`) REFERENCES `users` (`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
