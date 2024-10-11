#!/usr/bin/bash
# Script to install all the required dependencies for this project

# To use this file, run ./install.sh from project the directory

# Function to check if a package is installed
check_and_install_npm_package() {
    package=$1
    if npm list --depth=0 "$package" > /dev/null 2>&1; then
        echo "$package is already installed."
    else
        echo "$package is not installed. Installing $package..."
        npm install "$package"
    fi
}

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "npm is not installed. Installing Node.js and npm..."

    # Update package list and install Node.js and npm
    sudo apt update
    sudo apt install -y nodejs npm

    # Verify installation
    if command -v npm &> /dev/null
    then
        echo "Node.js and npm installed successfully."
    else
        echo "Installation failed. Please check the errors and try again."
        exit 1
    fi
else
    echo "npm is already installed."
fi

# Add npm to PATH if necessary
if ! echo "$PATH" | grep -q "$(dirname $(which npm))"
then
    echo "Adding npm to PATH..."
    echo 'export PATH=$PATH:'"$(dirname $(which npm))" >> ~/.bashrc
    source ~/.bashrc
    echo "npm added to PATH."
else
    echo "npm is already in PATH."
fi

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "package.json found. Installing dependencies..."
    npm install
    echo "Dependencies installed successfully."

    # Check if MongoDB is installed
    if ! mongod --version > /dev/null 2>&1; then
        echo "MongoDB not installed. Installing MongoDB..."
        sudo apt-get install -y gnupg # Install the gnupg utility

        # Import the public MongoDB signing key
        wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

        # Update the package list and install MongoDB
        sudo apt-get update
        sudo apt-get install -y mongodb-org
    else
        echo "MongoDB is already installed."
    fi

	# Start MongoDB if it's not running
    if ! sudo systemctl is-active --quiet mongod; then
        echo "Starting MongoDB..."
        sudo systemctl daemon-reload
        sudo systemctl start mongod
        sudo systemctl enable mongod
    else
        echo "MongoDB is already running."
    fi

    # Check if Redis is installed
    if ! redis-server --version > /dev/null 2>&1; then
        echo "Redis not installed. Installing Redis..."
        sudo apt-get install -y redis-server
    else
        echo "Redis is already installed."
    fi

    # Start Redis if it's not running
    if ! sudo systemctl is-active --quiet redis-server; then
        echo "Starting Redis..."
        sudo systemctl start redis-server
        sudo systemctl enable redis-server
    else
        echo "Redis is already running."
    fi
	# Test Redis with a ping
    redis-cli ping || echo "Redis ping failed."

    echo "Now confirming the version and presence of the most important npm packages..."

    # Check required npm packages
    check_and_install_npm_package "express"
    check_and_install_npm_package "socket.io"
    check_and_install_npm_package "redis"
    check_and_install_npm_package "mongodb"
    check_and_install_npm_package "axios"
    check_and_install_npm_package "ejs"
    check_and_install_npm_package "cookie-parser"
    check_and_install_npm_package "uuid"
    check_and_install_npm_package "multer"
    check_and_install_npm_package "form-data"
    check_and_install_npm_package "multer-gridfs-storage"

    echo "All required npm packages are installed."

else
    echo "No package.json file found. Please make sure you're in the correct directory."
fi