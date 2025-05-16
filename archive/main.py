import os
import time
import datetime
import random
import json
import pathlib
import bcrypt
from cryptography.fernet import Fernet
import re
from typing import Dict, Optional
import hashlib

# Security constants
PASSWORD_MIN_LENGTH = 8
MAX_LOGIN_ATTEMPTS = 3
LOGIN_TIMEOUT_MINUTES = 5
SESSION_TIMEOUT_MINUTES = 15

# Path constants
DATA_DIR = "vault_data"
USER_FILE = os.path.join(DATA_DIR, "users.json")
ENTRIES_FILE = os.path.join(DATA_DIR, "entries.json")
KEY_FILE = os.path.join(DATA_DIR, "key.key")
LOGIN_ATTEMPTS_FILE = os.path.join(DATA_DIR, "login_attempts.json")

# Make sure the data directory exists
pathlib.Path(DATA_DIR).mkdir(exist_ok=True)

def generate_encryption_key() -> bytes:
    """Generate a new encryption key if one doesn't exist"""
    if not os.path.exists(KEY_FILE):
        key = Fernet.generate_key()
        with open(KEY_FILE, 'wb') as key_file:
            key_file.write(key)
    else:
        with open(KEY_FILE, 'rb') as key_file:
            key = key_file.read()
    return key

def get_fernet() -> Fernet:
    """Get Fernet instance with the encryption key"""
    key = generate_encryption_key()
    return Fernet(key)

def encrypt_data(data: str) -> str:
    """Encrypt data using Fernet"""
    f = get_fernet()
    return f.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str) -> str:
    """Decrypt data using Fernet"""
    f = get_fernet()
    return f.decrypt(encrypted_data.encode()).decode()

def validate_password(password: str) -> tuple[bool, str]:
    """Validate password complexity"""
    if len(password) < PASSWORD_MIN_LENGTH:
        return False, f"Password must be at least {PASSWORD_MIN_LENGTH} characters long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    return True, ""

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hashed password"""
    return bcrypt.checkpw(password.encode(), hashed_password.encode())

def load_login_attempts() -> Dict[str, Dict[str, int]]:
    """Load login attempts from file"""
    if os.path.exists(LOGIN_ATTEMPTS_FILE):
        try:
            with open(LOGIN_ATTEMPTS_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}

def save_login_attempts(attempts: Dict[str, Dict[str, int]]) -> None:
    """Save login attempts to file"""
    with open(LOGIN_ATTEMPTS_FILE, 'w') as f:
        json.dump(attempts, f, indent=2)

def check_login_attempts(username: str) -> tuple[bool, Optional[str]]:
    """Check if user has exceeded login attempts"""
    attempts = load_login_attempts()
    now = int(time.time())
    
    if username in attempts:
        user_attempts = attempts[username]
        if user_attempts['count'] >= MAX_LOGIN_ATTEMPTS:
            time_elapsed = now - user_attempts['timestamp']
            if time_elapsed < LOGIN_TIMEOUT_MINUTES * 60:
                remaining_time = LOGIN_TIMEOUT_MINUTES - (time_elapsed // 60)
                return False, f"Too many login attempts. Please try again in {remaining_time} minutes."
            else:
                # Reset attempts after timeout
                attempts[username] = {'count': 0, 'timestamp': now}
                save_login_attempts(attempts)
    
    return True, None

def update_login_attempts(username: str, success: bool) -> None:
    """Update login attempts for a user"""
    attempts = load_login_attempts()
    now = int(time.time())
    
    if username not in attempts:
        attempts[username] = {'count': 0, 'timestamp': now}
    
    if success:
        attempts[username]['count'] = 0
    else:
        attempts[username]['count'] += 1
        attempts[username]['timestamp'] = now
    
    save_login_attempts(attempts)

def load_users():
    """Load user data from file"""
    if os.path.exists(USER_FILE):
        try:
            with open(USER_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}

def save_users(users_data):
    """Save user data to file"""
    with open(USER_FILE, 'w') as f:
        json.dump(users_data, f, indent=2)

def load_entries():
    """Load diary entries from file"""
    if os.path.exists(ENTRIES_FILE):
        try:
            with open(ENTRIES_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}

def save_entries(entries_data):
    """Save diary entries to file"""
    with open(ENTRIES_FILE, 'w') as f:
        json.dump(entries_data, f, indent=2)

def randomNumber():
    """Generate a random salt number between 10000 and 99999"""
    number = random.randint(10000, 99999)
    return number

def clear_screen():
    """Clear the terminal screen based on the OS"""
    os.system('cls' if os.name == 'nt' else 'clear')

def add():
    """Add a new diary entry with timestamp as key"""
    text = input("\nEnter your thoughts: \n> ")
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
    
    entries = load_entries()
    entries[timestamp] = encrypt_data(text)
    save_entries(entries)
    
    print("Entry added!")
    time.sleep(2)

def view():
    """View diary entries with filtering options"""
    clear_screen()
    entries = load_entries()
    
    if not entries:
        print("No entries to display!")
        time.sleep(2)
        return
    
    # Create sorted list of entries
    entries_list = []
    for key in sorted(entries.keys(), reverse=True):
        try:
            decrypted_text = decrypt_data(entries[key])
            entries_list.append(f"{key}: {decrypted_text}")
        except Exception as e:
            print(f"Error decrypting entry {key}: {str(e)}")
            continue
    
    ask = input("View mode\n1. View all entries\n2. View date\n> ")
    
    if ask == "1":
        i = len(entries_list)
        for row in entries_list:            
            print(row)
            i -= 1
            
            if i == 0:
                input("No more entries to display! Press enter to return to main menu: ")
                time.sleep(1)
                break
            else:
                ask = input("Enter y to view the previous entry. Enter anything else to quit.\n> ")
            
            if ask == "y":
                continue
            else:
                print("Goodbye, you will be redirected to the menu!")
                time.sleep(2)
                break
    
    elif ask == "2":
        try:
            year = int(input("Enter year: "))
            month = int(input("Enter month: "))
            day = int(input("Enter day: "))
            user_date = datetime.date(year, month, day)
            
            entries_found = 0
            
            for key in sorted(entries.keys(), reverse=True):
                try:
                    entry_datetime = datetime.datetime.strptime(key, "%Y-%m-%d %H:%M:%S.%f")
                    entry_date = entry_datetime.date()
                    
                    if entry_date == user_date:
                        decrypted_text = decrypt_data(entries[key])
                        print(f"{key}: {decrypted_text}")
                        entries_found += 1
                        input("Press enter to view the next entry/quit: ")
                except ValueError:
                    # Skip if the key is not in expected datetime format
                    continue
                except Exception as e:
                    print(f"Error decrypting entry {key}: {str(e)}")
                    continue
            
            if entries_found == 0:
                print("No entries found for that date.")
                time.sleep(2)
        except ValueError:
            print("Invalid date format. Please enter valid numbers.")
            time.sleep(2)

def createUser():
    """Create a new user account with salted and hashed password"""
    print("\nCreate your account\n")
    while True:
        username = input("Enter username\n> ")
        if not username:
            print("Username cannot be empty. Please try again.")
            continue
        break

    while True:
        password = input("Enter password\n> ")
        is_valid, error_message = validate_password(password)
        if not is_valid:
            print(f"Password validation failed: {error_message}")
            print("Password must contain:")
            print(f"- At least {PASSWORD_MIN_LENGTH} characters")
            print("- At least one uppercase letter")
            print("- At least one lowercase letter")
            print("- At least one number")
            print("- At least one special character")
            continue
        break

    hashed_password = hash_password(password)
    
    users = load_users()
    users[username] = {"password": hashed_password}
    save_users(users)
    
    print("\nWelcome to the Vault " + username.upper())
    time.sleep(3)
    return True

def login():
    """Login with username and password"""
    print("\nLogin to view the diary\n")
    username = input("Enter username\n> ")
    
    # Check login attempts
    can_login, error_message = check_login_attempts(username)
    if not can_login:
        print(error_message)
        time.sleep(2)
        return False
    
    users = load_users()
    
    if username in users:
        while True:
            password = input("Enter password\n> ")
            
            # Handle migration from SHA-256 to bcrypt
            stored_password = users[username]["password"]
            if "salt" in users[username]:  # Old SHA-256 format
                salt = users[username]['salt']
                salted_password = f"{password}.{salt}"
                old_hashed = hashlib.sha256(salted_password.encode()).hexdigest()
                if old_hashed == stored_password:
                    # Migrate to bcrypt
                    users[username]["password"] = hash_password(password)
                    del users[username]["salt"]
                    save_users(users)
                    print("\nAccess granted.")
                    update_login_attempts(username, True)
                    time.sleep(2)
                    return True
            else:  # New bcrypt format
                if verify_password(password, stored_password):
                    print("\nAccess granted.")
                    update_login_attempts(username, True)
                    time.sleep(2)
                    return True
            
            update_login_attempts(username, False)
            can_login, error_message = check_login_attempts(username)
            if not can_login:
                print(error_message)
                time.sleep(2)
                return False
            print("Wrong password, try again!")
            time.sleep(1)
    else:
        print("Username not found. Shutting down.")
        time.sleep(2)
        return False
    
    return False  # If execution reaches here, login was unsuccessful

# Main program
def main():
    clear_screen()
    print("The Vault")
    
    users = load_users()
    logged_in = False
    
    if not users:
        logged_in = createUser()
    else:
        logged_in = login()
    
    if logged_in:
        while True:
            clear_screen()
            print("The Vault Menu")
            ask = input("1. Add entry\n2. View entries\n3. Exit\n> ")
            if ask == "1":
                add()
            elif ask == "2":
                view()
            elif ask == "3":
                print("Goodbye! Exiting The Vault.")
                time.sleep(1)
                break
            else:
                print("Invalid option. Please try again.")
                time.sleep(1)

if __name__ == "__main__":
    main()