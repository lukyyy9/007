# Requirements Document

## Introduction

This document outlines the requirements for a tactical multiplayer online card game. The game is a turn-based strategic card game where players reduce their opponent's health points through combinations of attacks, defenses, and special effects. The game features real-time online multiplayer capabilities with a mobile-first approach, supporting both 1v1 duels and tournament modes.

## Requirements

### Requirement 1

**User Story:** As a player, I want to participate in real-time 1v1 duels, so that I can compete against other players in strategic card battles.

#### Acceptance Criteria

1. WHEN a player starts a 1v1 duel THEN the system SHALL initialize both players with 6 health points and 0 charges
2. WHEN a turn begins THEN each player SHALL have exactly 20 seconds to select 3 cards
3. IF a player does not select cards within the time limit THEN the system SHALL automatically fill their sequence with 3 "Charger" cards
4. WHEN both players have selected their cards THEN the system SHALL resolve the turn in 3 sequential steps
5. WHEN a player's health reaches 0 or below THEN the system SHALL end the match and declare the opponent as winner

### Requirement 2

**User Story:** As a player, I want to use different card types with unique effects, so that I can develop strategic gameplay combinations.

#### Acceptance Criteria

1. WHEN a player plays a "Charger" card THEN the system SHALL increase their charges by 1 at no cost
2. WHEN a player plays a "Tirer" card THEN the system SHALL consume 1 charge and deal 1 damage to the opponent
3. WHEN a player plays a "Big Blast" card THEN the system SHALL consume 3 charges and deal 5 damage to the opponent
4. WHEN a player plays a "Bloquer" card THEN the system SHALL negate all incoming damage for that step
5. WHEN a player plays a "Brûler" card THEN the system SHALL consume 2 charges, deal 1 damage, and apply a burn status for 2 turns
6. WHEN a burn status is active THEN the system SHALL deal 1 damage at the beginning of each turn
7. WHEN a player plays a "Riposte" card AND successfully blocks damage THEN the system SHALL deal 2 damage to the attacker
8. WHEN a player plays a "Furie" card THEN the system SHALL consume 2 charges, deal 3 damage to opponent, and 2 damage to self
9. WHEN a player plays "Armure magique" THEN the system SHALL consume 3 charges and negate all damage for that step
10. WHEN a player plays "Court circuit" AND opponent blocked damage THEN the system SHALL grant 2 charges, otherwise 1 charge and 2 self-damage
11. WHEN a player plays "Vampirisme" AND opponent blocked damage THEN the system SHALL heal 1 health point
12. WHEN a player plays "Tourmente" in first step THEN the system SHALL punish opponent's repeated cards at turn end with 1 damage per repetition

### Requirement 3

**User Story:** As a player, I want to participate in tournaments with multiple players, so that I can compete in organized competitive events.

#### Acceptance Criteria

1. WHEN a tournament is created THEN the system SHALL allow configuration of player count, format, and lives per match
2. WHEN a tournament starts THEN the system SHALL automatically manage matchups based on the selected format
3. WHEN tournament matches are completed THEN the system SHALL update the progression table automatically
4. WHEN a tournament ends THEN the system SHALL display final rankings and save results to the database
5. WHEN players are eliminated THEN the system SHALL update their status and continue with remaining players

### Requirement 4

**User Story:** As a player, I want a responsive mobile-first interface, so that I can play comfortably on my mobile device.

#### Acceptance Criteria

1. WHEN the game loads THEN the interface SHALL prioritize mobile layout and touch interactions
2. WHEN displaying game resources THEN the system SHALL use emojis instead of text where possible
3. WHEN actions are available THEN the system SHALL make only valid actions clickable based on current resources
4. WHEN the turn timer is active THEN the system SHALL display a visual countdown timer
5. WHEN game events occur THEN the system SHALL show appropriate animations and visual feedback
6. WHEN actions are logged THEN the system SHALL maintain a readable action history

### Requirement 5

**User Story:** As a player, I want real-time synchronization with my opponent, so that the game state remains consistent and fair.

#### Acceptance Criteria

1. WHEN players make actions THEN the system SHALL synchronize all game state changes via WebSockets
2. WHEN validating actions THEN the server SHALL be the single source of truth for all game logic
3. WHEN clients attempt invalid actions THEN the server SHALL reject them and maintain game integrity
4. WHEN network issues occur THEN the system SHALL handle disconnections gracefully
5. WHEN reconnecting THEN the system SHALL restore the current game state accurately

### Requirement 6

**User Story:** As a player, I want my game progress and tournament results saved, so that I can track my performance over time.

#### Acceptance Criteria

1. WHEN a match ends THEN the system SHALL save the result to the PostgreSQL database
2. WHEN tournaments complete THEN the system SHALL persist all match results and final rankings
3. WHEN players create accounts THEN the system SHALL store their profile information securely
4. WHEN querying historical data THEN the system SHALL provide access to past match and tournament results
5. WHEN the system scales THEN the database SHALL handle multiple concurrent games and tournaments

### Requirement 7

**User Story:** As a player, I want configurable game modes, so that I can customize my gaming experience.

#### Acceptance Criteria

1. WHEN creating a duel THEN the system SHALL allow configuration of lives count (Best of 3, Best of 5, etc.)
2. WHEN setting up matches THEN the system SHALL allow timer customization (default 20 seconds)
3. WHEN a Best of X match is configured THEN the system SHALL track wins and continue until one player reaches the required victories
4. WHEN match parameters are set THEN the system SHALL enforce these settings throughout the entire match series

### Requirement 8

**User Story:** As a player, I want an intuitive lobby and matchmaking system, so that I can easily find and join games.

#### Acceptance Criteria

1. WHEN entering the lobby THEN the system SHALL display options to create or join games
2. WHEN viewing available games THEN the system SHALL show current tournaments and open matches
3. WHEN joining a game room THEN the system SHALL display all players and game parameters
4. WHEN in a waiting room THEN the system SHALL show real-time updates of player status
5. WHEN games are ready to start THEN the system SHALL automatically transition all players to the game interface