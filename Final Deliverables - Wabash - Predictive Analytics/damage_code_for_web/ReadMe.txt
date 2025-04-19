# DAMAGE TRACKING SYSTEM

## What is this?

This is a simple tool that helps keep track of trailer damage. It lets you:

- Report damage on a trailer
- Log when and where a trailer was used, and by which customer
- Automatically figure out who might be responsible for any damage
- Get email alerts when damage is found

## What’s inside:

1. `damage_tracking_app.py`  
   This is the backend program. It does all the work in the background like saving reports and running the damage checks.

2. `page.tsx`  
   This is the frontend – the webpage you see and use to enter reports or check damage.

## How to use:

To use the tool:

- Open the webpage and fill in the inspection or trailer movement info
- The system will check if there is any damage
- If damage is found, it will:
  - Try to find out which customer may be responsible
  - Send an email with the results

## Important:

- This tool stores everything in a small database on your computer
- It sends emails when damage is found (you can update the email info in the code)
- Works best when used with both the backend and frontend running at the same time

## Made by:

Yijun Wang (donaughty1215@gmail.com)
