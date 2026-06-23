-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `esports_db`;
USE `esports_db`;

-- Drop tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS `leaderboard`;
DROP TABLE IF EXISTS `matches`;
DROP TABLE IF EXISTS `registrations`;
DROP TABLE IF EXISTS `players`;
DROP TABLE IF EXISTS `teams`;
DROP TABLE IF EXISTS `tournaments`;
DROP TABLE IF EXISTS `admins`;

-- 1. Admins Table
CREATE TABLE `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tournaments Table
CREATE TABLE `tournaments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `game` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('upcoming', 'live', 'completed') DEFAULT 'upcoming',
  `prize_pool` VARCHAR(100) DEFAULT '0',
  `slots` INT DEFAULT 16,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Teams Table
CREATE TABLE `teams` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `logo_url` VARCHAR(255) DEFAULT NULL,
  `contact_email` VARCHAR(100) NOT NULL,
  `contact_phone` VARCHAR(20) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Players Table
CREATE TABLE `players` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `team_id` INT NOT NULL,
  `in_game_name` VARCHAR(100) NOT NULL,
  `real_name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'Player',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Registrations (Assigned Teams to Tournaments)
CREATE TABLE `registrations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tournament_id` INT NOT NULL,
  `team_id` INT NOT NULL,
  `registration_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_tourney_team` (`tournament_id`, `team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Matches Table
CREATE TABLE `matches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tournament_id` INT NOT NULL,
  `team1_id` INT NOT NULL,
  `team2_id` INT NOT NULL,
  `match_time` DATETIME NOT NULL,
  `status` ENUM('upcoming', 'live', 'completed') DEFAULT 'upcoming',
  `winner_id` INT DEFAULT NULL,
  `team1_score` INT DEFAULT 0,
  `team2_score` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`team1_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`team2_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`winner_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Leaderboard / Points Table
CREATE TABLE `leaderboard` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tournament_id` INT NOT NULL,
  `team_id` INT NOT NULL,
  `wins` INT DEFAULT 0,
  `losses` INT DEFAULT 0,
  `matches_played` INT DEFAULT 0,
  `kills` INT DEFAULT 0,
  `points` INT DEFAULT 0,
  FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_tourney_leaderboard` (`tournament_id`, `team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- INSERT SAMPLE SEED DATA
-- ==========================================

-- Admin account (password is 'admin123' bcrypt-hashed)
INSERT INTO `admins` (`username`, `password`) VALUES 
('admin', '$2a$10$XiZTM8Aycg5KKRGc.hJ10ehzPO3Fq7mM8VBRqsT36X0zifvXR5fja');

-- Sample Tournaments
INSERT INTO `tournaments` (`id`, `name`, `game`, `start_date`, `end_date`, `status`, `prize_pool`, `slots`) VALUES
(1, 'BGMI Ultimate Championship 2026', 'BGMI', '2026-07-01', '2026-07-15', 'upcoming', '₹50,00,000', 16),
(2, 'Free Fire Pro Series', 'Free Fire', '2026-06-15', '2026-06-30', 'live', '₹20,00,000', 12),
(3, 'BGMI Invitational Cup', 'BGMI', '2026-05-01', '2026-05-10', 'completed', '₹10,00,000', 8);

-- Sample Teams
INSERT INTO `teams` (`id`, `name`, `logo_url`, `contact_email`, `contact_phone`, `status`) VALUES
(1, 'Team Soul', 'https://api.dicebear.com/7.x/identicon/svg?seed=soul', 'soul@esports.com', '9876543210', 'approved'),
(2, 'GodLike Esports', 'https://api.dicebear.com/7.x/identicon/svg?seed=godlike', 'godlike@esports.com', '9876543211', 'approved'),
(3, 'Orangutan Gaming', 'https://api.dicebear.com/7.x/identicon/svg?seed=orangutan', 'orangutan@esports.com', '9876543212', 'approved'),
(4, 'Team XSpark', 'https://api.dicebear.com/7.x/identicon/svg?seed=xspark', 'xspark@esports.com', '9876543213', 'approved'),
(5, 'Global Esports', 'https://api.dicebear.com/7.x/identicon/svg?seed=global', 'global@esports.com', '9876543214', 'approved'),
(6, 'Entity Gaming', 'https://api.dicebear.com/7.x/identicon/svg?seed=entity', 'entity@esports.com', '9876543215', 'pending'),
(7, '8Bit Esports', 'https://api.dicebear.com/7.x/identicon/svg?seed=8bit', '8bit@esports.com', '9876543216', 'rejected');

-- Sample Players
-- Team Soul (ID 1)
INSERT INTO `players` (`team_id`, `in_game_name`, `real_name`, `role`) VALUES
(1, 'SoulManya', 'Manya Esports', 'IGL'),
(1, 'SoulNakul', 'Nakul Sharma', 'Assaulter'),
(1, 'SoulRony', 'Rony Esports', 'Support'),
(1, 'SoulJoker', 'Joker Gaming', 'Assaulter');

-- GodLike Esports (ID 2)
INSERT INTO `players` (`team_id`, `in_game_name`, `real_name`, `role`) VALUES
(2, 'JONATHAN', 'Jonathan Amaral', 'Assaulter'),
(2, 'Jelly', 'Jelly Esports', 'IGL'),
(2, 'ZGOD', 'Abhishek Choudhary', 'Support'),
(2, 'Aditya', 'Aditya Mathe', 'Assaulter');

-- Orangutan Gaming (ID 3)
INSERT INTO `players` (`team_id`, `in_game_name`, `real_name`, `role`) VALUES
(3, 'Ash', 'Ashish Bhatia', 'IGL'),
(3, 'WizzGod', 'Wizz Esports', 'Assaulter'),
(3, 'Believe', 'Believe Gaming', 'Assaulter'),
(3, 'Drigger', 'Drigger Esports', 'Support');

-- Team XSpark (ID 4)
INSERT INTO `players` (`team_id`, `in_game_name`, `real_name`, `role`) VALUES
(4, 'Shadow', 'Shadow IGL', 'IGL'),
(4, 'Sarayu', 'Sarayu Sharma', 'Assaulter'),
(4, 'SprayGod', 'SprayGod Esports', 'Assaulter'),
(4, 'Joker', 'Joker Support', 'Support');

-- Global Esports (ID 5)
INSERT INTO `players` (`team_id`, `in_game_name`, `real_name`, `role`) VALUES
(5, 'Mavi', 'Mavi IGL', 'IGL'),
(5, 'NinjaOD', 'Ninja Gaming', 'Assaulter'),
(5, 'Beast', 'Beast Esports', 'Assaulter'),
(5, 'Slug', 'Slug Gaming', 'Support');

-- Sample Registrations
-- Register approved teams for Tournament 1 (BGMI Ultimate Championship)
INSERT INTO `registrations` (`tournament_id`, `team_id`) VALUES
(1, 1), -- Soul
(1, 2), -- GodLike
(1, 3), -- Orangutan
(1, 4); -- XSpark

-- Register approved teams for Tournament 2 (Free Fire Pro Series)
INSERT INTO `registrations` (`tournament_id`, `team_id`) VALUES
(2, 1), -- Soul
(2, 3), -- Orangutan
(2, 5); -- Global

-- Register approved teams for Tournament 3 (BGMI Invitational Cup)
INSERT INTO `registrations` (`tournament_id`, `team_id`) VALUES
(3, 1), -- Soul
(3, 2), -- GodLike
(3, 3), -- Orangutan
(3, 4); -- XSpark

-- Sample Matches
-- Completed matches for Tournament 3 (BGMI Invitational Cup)
INSERT INTO `matches` (`id`, `tournament_id`, `team1_id`, `team2_id`, `match_time`, `status`, `winner_id`, `team1_score`, `team2_score`) VALUES
(1, 3, 1, 2, '2026-05-02 14:00:00', 'completed', 1, 15, 10),
(2, 3, 3, 4, '2026-05-02 16:00:00', 'completed', 3, 12, 11),
(3, 3, 1, 3, '2026-05-03 14:00:00', 'completed', 1, 18, 12),
(4, 3, 2, 4, '2026-05-03 16:00:00', 'completed', 2, 15, 8);

-- Live match for Tournament 2 (Free Fire Pro Series)
INSERT INTO `matches` (`id`, `tournament_id`, `team1_id`, `team2_id`, `match_time`, `status`, `winner_id`, `team1_score`, `team2_score`) VALUES
(5, 2, 1, 3, '2026-06-23 18:00:00', 'live', NULL, 8, 6);

-- Upcoming matches for Tournament 1 (BGMI Ultimate Championship)
INSERT INTO `matches` (`id`, `tournament_id`, `team1_id`, `team2_id`, `match_time`, `status`, `winner_id`, `team1_score`, `team2_score`) VALUES
(6, 1, 1, 2, '2026-07-02 15:00:00', 'upcoming', NULL, 0, 0),
(7, 1, 3, 4, '2026-07-02 17:00:00', 'upcoming', NULL, 0, 0);

-- Populate Leaderboard for Tournament 3 (Completed BGMI Invitational Cup)
-- Team Soul: Played 2, Won 2, Lost 0, Kills 33, Points 45
-- GodLike: Played 2, Won 1, Lost 1, Kills 25, Points 30
-- Orangutan: Played 2, Won 1, Lost 1, Kills 24, Points 28
-- XSpark: Played 2, Won 0, Lost 2, Kills 19, Points 10
INSERT INTO `leaderboard` (`tournament_id`, `team_id`, `wins`, `losses`, `matches_played`, `kills`, `points`) VALUES
(3, 1, 2, 0, 2, 33, 45),
(3, 2, 1, 1, 2, 25, 30),
(3, 3, 1, 1, 2, 24, 28),
(3, 4, 0, 2, 2, 19, 10);

-- Populate Leaderboard for Tournament 2 (Free Fire Pro Series - Live)
INSERT INTO `leaderboard` (`tournament_id`, `team_id`, `wins`, `losses`, `matches_played`, `kills`, `points`) VALUES
(2, 1, 0, 0, 0, 8, 8),
(2, 3, 0, 0, 0, 6, 6),
(2, 5, 0, 0, 0, 0, 0);

-- Populate Leaderboard for Tournament 1 (Upcoming - all zeros)
INSERT INTO `leaderboard` (`tournament_id`, `team_id`, `wins`, `losses`, `matches_played`, `kills`, `points`) VALUES
(1, 1, 0, 0, 0, 0, 0),
(1, 2, 0, 0, 0, 0, 0),
(1, 3, 0, 0, 0, 0, 0),
(1, 4, 0, 0, 0, 0, 0);
