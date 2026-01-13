#!/bin/bash
# Setup script for Kokoro TTS in a Python virtual environment
# This automates the installation and initialization of Kokoro TTS

set -e  # Exit on error

VENV_DIR=".kokoro-venv"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV_PATH="$PROJECT_ROOT/$VENV_DIR"

echo "🎙️  Setting up Kokoro TTS in virtual environment..."

# Check if Python 3 is available and find compatible version
# kokoro-tts-tool requires Python >=3.13
PYTHON_CMD=""
PYTHON_VERSION=""

# Try to find a compatible Python version (>=3.13, or try 3.12 as fallback)
# Check common locations including conda/anaconda
PYTHON_PATHS=(
    "python3.14" "python3.13" "python3.12" "python3.11" "python3.10" "python3.9" "python3"
    "/opt/anaconda3/bin/python3.14" "/opt/anaconda3/bin/python3.13"
    "/opt/anaconda3/bin/python3.12" "/opt/anaconda3/bin/python3.11"
    "/opt/anaconda3/bin/python3.10" "/opt/anaconda3/bin/python3.9"
    "/usr/local/bin/python3.14" "/usr/local/bin/python3.13"
    "/usr/local/bin/python3.12" "/usr/local/bin/python3.11"
    "/usr/local/bin/python3.10" "/usr/local/bin/python3.9"
)

for py_path in "${PYTHON_PATHS[@]}"; do
    # Check if Python exists (handle both command and file paths)
    python_exists=false
    if command -v "$py_path" &> /dev/null; then
        python_exists=true
    elif [ -f "$py_path" ] && [ -x "$py_path" ]; then
        python_exists=true
    fi
    
    if [ "$python_exists" = false ]; then
        continue
    fi
    
    # Get version (suppress errors to avoid exiting with set -e)
    version_output=$("$py_path" --version 2>&1 || echo "")
    if [ -z "$version_output" ]; then
        continue
    fi
    
    # Extract version number (e.g., "3.13.0" -> "3.13")
    version=$(echo "$version_output" | grep -oE '[0-9]+\.[0-9]+' | head -1)
    if [ -z "$version" ]; then
        continue
    fi
    
    major=$(echo "$version" | cut -d. -f1)
    minor=$(echo "$version" | cut -d. -f2)
    
    # Check if version is compatible
    # kokoro-tts-tool requires >=3.13, kokoro-onnx requires >=3.12,<3.14
    # So we need Python 3.13 (3.14 is too new for kokoro-onnx)
    if [ "$major" -eq 3 ]; then
        if [ "$minor" -eq 13 ]; then
            # Python 3.13 is the perfect match
            PYTHON_CMD="$py_path"
            PYTHON_VERSION="$version"
            break
        elif [ "$minor" -eq 14 ] && [ -z "$PYTHON_CMD" ]; then
            # Python 3.14 is too new for kokoro-onnx, but store as last resort
            echo "⚠️  Warning: Python 3.14 is too new for kokoro-onnx (requires <3.14)"
            echo "   Will try to use it, but installation may fail"
            PYTHON_CMD="$py_path"
            PYTHON_VERSION="$version"
        elif [ "$minor" -ge 12 ] && [ "$minor" -lt 13 ] && [ -z "$PYTHON_CMD" ]; then
            # Python 3.12 is too old for kokoro-tts-tool, but store as fallback
            PYTHON_CMD="$py_path"
            PYTHON_VERSION="$version"
        fi
    fi
done

# Check compatibility and warn if needed
if [ -n "$PYTHON_CMD" ]; then
    version_check=$(echo "$PYTHON_VERSION" | cut -d. -f2)
    if [ "$version_check" -eq 14 ]; then
        echo "❌ Error: Python 3.14 is too new for kokoro-onnx (requires <3.14)"
        echo "   Please install Python 3.13 instead"
        exit 1
    elif [ "$version_check" -lt 13 ]; then
        echo "❌ Error: kokoro-tts-tool requires Python >=3.13"
        echo "   Found Python $PYTHON_VERSION, which is not compatible"
        echo "   Please install Python 3.13"
        exit 1
    fi
fi

if [ -z "$PYTHON_CMD" ]; then
    echo "❌ Error: No Python version found."
    echo "   kokoro-tts-tool requires Python >=3.13 (recommended)"
    echo ""
    echo "   Found Python versions:"
    for py_version in python3.14 python3.13 python3.12 python3.11 python3.10 python3.9 python3; do
        if command -v "$py_version" &> /dev/null; then
            echo "     - $py_version: $($py_version --version 2>&1)"
        fi
    done
    echo ""
    echo "   kokoro-tts-tool requires Python >=3.13"
    echo "   kokoro-onnx requires Python >=3.12,<3.14"
    echo "   So you need Python 3.13 exactly"
    echo ""
    echo "   On macOS: brew install python@3.13"
    echo "   Or use conda: conda create -n kokoro python=3.13"
    exit 1
fi

echo "✓ Using Python $PYTHON_VERSION ($PYTHON_CMD)"

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_PATH" ]; then
    echo "📦 Creating Python virtual environment..."
    "$PYTHON_CMD" -m venv "$VENV_PATH"
    echo "✓ Virtual environment created at $VENV_PATH"
else
    echo "✓ Virtual environment already exists at $VENV_PATH"
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source "$VENV_PATH/bin/activate"

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip --quiet

# Install kokoro-tts-tool
echo "📥 Installing kokoro-tts-tool..."
if pip install kokoro-tts-tool --quiet; then
    echo "✓ kokoro-tts-tool installed successfully"
else
    echo "❌ Error: Failed to install kokoro-tts-tool"
    echo "   Try running: pip install kokoro-tts-tool"
    exit 1
fi

# Initialize Kokoro (downloads models)
echo "📦 Initializing Kokoro TTS (this will download models ~350MB)..."
if kokoro-tts-tool init; then
    echo "✓ Kokoro TTS initialized successfully"
else
    echo "⚠️  Warning: Initialization may have failed, but continuing..."
    echo "   You can run 'kokoro-tts-tool init' manually later"
fi

# List available voices
echo ""
echo "🎤 Available voices:"
kokoro-tts-tool list-voices 2>/dev/null || echo "   (Run 'kokoro-tts-tool list-voices' to see voices)"

echo ""
echo "✅ Setup complete!"
echo ""
echo "The virtual environment is located at: $VENV_PATH"
echo ""
echo "To use Kokoro TTS, the tool will automatically detect this virtual environment."
echo "You can also activate it manually with:"
echo "  source $VENV_PATH/bin/activate"
echo ""
echo "Now you can run:"
echo "  npm run generate-audio -- --provider kokoro --type all --update-json"
