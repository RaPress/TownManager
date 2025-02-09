### **🔥 README.md Update Proposal** 🚀  

# **📖 Town Manager Bot**
🚀 **A Discord bot for managing town-based RPG adventures!**  

---

## **📌 Features**
✅ **Manage structures** – Add, list, and upgrade buildings.  
✅ **Milestone tracking** – Set and track structure progress.  
✅ **Voting system** – Cast votes and check results.  
✅ **Adventure tracking** – Start and end adventures.  
✅ **Interactive help system** – Get command details in Discord.  
✅ **Robust database integration** – SQLite3-backed persistence.  

---

## **🛠️ Installation & Setup**
### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/RaPress/TownManager.git
cd TownManager
```

### **2️⃣ Install Dependencies**
```sh
npm install
```

### **3️⃣ Set Up Environment Variables**
Create a `.env` file in the root directory and add:  
```sh
DISCORD_BOT_TOKEN=your-bot-token-here
```
🔹 **Replace `your-bot-token-here` with your actual Discord bot token.**  

### **4️⃣ Start the Bot**
```sh
npm run start
```
🔹 The bot will connect to Discord and begin listening for commands! 🎮  

---

## **💡 Available Commands**
| Command                                                   | Description                         |
| --------------------------------------------------------- | ----------------------------------- |
| `!add_structure <name>`                                   | Adds a new structure                |
| `!structures`                                             | Lists all structures                |
| `!set_milestones <structure_id> <level> <votes_required>` | Sets a milestone                    |
| `!milestones`                                             | Lists all milestones                |
| `!upgrade <structure_name>`                               | Requests an upgrade for a structure |
| `!check_votes`                                            | Displays current vote results       |
| `!end_adventure`                                          | Ends an active adventure            |
| `!history`                                                | Shows recent bot history            |
| `!help`                                                   | Opens the interactive help menu     |

🔹 **Use `!help <command>` to get details about a specific command!**  

---

## **📂 Project Structure**
```
/src
├── commands/        # Individual bot commands
│   ├── structures.ts
│   ├── milestones.ts
│   ├── upgrade.ts
│   ├── history.ts
│   ├── voting.ts
├── handlers/        # Event handlers
│   ├── registerCommands.ts
│   ├── handleButtons.ts
│   ├── handleInteractions.ts
├── database/        # Database setup & queries
│   ├── db.ts        # TownDatabase class
│   ├── database.ts  # SQLite3 connection & schema
│   ├── dbTypes.ts   # Database type definitions
├── utils/           # Utility functions
│   ├── logger.ts    # Logging & error handling
│   ├── helpers.ts   # (Optional future helper functions)
├── bot.ts           # Bot entry point
├── .env             # Environment variables (ignored in Git)
```
🔹 **Separation of concerns makes it easy to extend the bot!**  

---

## **💾 Database Schema**
The bot uses **SQLite3** for persistence. Here are the key tables:  

### **🏗️ Structures**
| Column      | Type    | Description                       |
| ----------- | ------- | --------------------------------- |
| `id`        | INTEGER | Unique ID                         |
| `name`      | TEXT    | Structure name                    |
| `level`     | INTEGER | Current level                     |
| `max_level` | INTEGER | Max possible level                |
| `category`  | TEXT    | Category (e.g., General, Housing) |
| `guild_id`  | TEXT    | Server ID                         |

### **🗳️ Votes**
| Column         | Type    | Description          |
| -------------- | ------- | -------------------- |
| `user_id`      | TEXT    | Voter ID             |
| `structure_id` | INTEGER | Voted structure      |
| `adventure_id` | INTEGER | Associated adventure |
| `votes`        | INTEGER | Number of votes      |
| `guild_id`     | TEXT    | Server ID            |

### **⚔️ Adventure**
| Column     | Type    | Description         |
| ---------- | ------- | ------------------- |
| `id`       | INTEGER | Unique adventure ID |
| `guild_id` | TEXT    | Server ID           |

---

## **🛠️ Contributing**
Want to improve the bot? **Pull requests are welcome!**  
### **✅ To Contribute:**
1. **Fork the repository** on GitHub.  
2. **Create a new branch** (`git checkout -b feature-new-thing`).  
3. **Make your changes & commit** (`git commit -m "Added new feature"`).  
4. **Push to your fork** (`git push origin feature-new-thing`).  
5. **Open a Pull Request! 🎉**  

---

## **🚀 Future Improvements**
✅ **Slash command support**  
✅ **More role-based permissions for commands**  
✅ **Additional automation for adventure events**  

---

## **📜 License**
🔹 **MIT License** – Free to use and modify.