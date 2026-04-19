#!/bin/zsh

osascript <<'APPLESCRIPT'
tell application "Terminal"
  activate
  do script "cd \"/Users/shirenyuan/Desktop/AI编程/superev用研中心\" && npm run dev"
end tell
APPLESCRIPT
