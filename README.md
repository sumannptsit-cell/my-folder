# Tentmaker Open — Capstone 1

A read-only web application for viewing group rosters, group boards, leader channels, and membership history.

## Project

Diploma in Software Development  
Tentmaker IT Fellowship  
Capstone 1 — Tentmaker Open

---

## What the application does

This project loads data from a Google Sheet through four CSV endpoints.

The application has four main functions:

1. Group Roster
2. Group Board
3. Leader Channel
4. History

The application is read-only. It does not write data back to the Google Sheet.

The data flow is:

Google Sheet
↓
Load CSV
↓
Store data in JavaScript arrays
↓
Filter / map / find / sort
↓
Display on the webpage

---

## Main data collections

The application stores the loaded information in four arrays:

```javascript
people[]
groups[]
memberships[]
posts[]