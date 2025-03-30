# Pairing Picker

A web application for managing and viewing airline crew pairings. This application allows you to upload and view pairing PDFs, select specific pairings, and manage them efficiently.

## Features

- Upload and parse pairing PDF files
- View pairings in a table format
- Select and manage specific pairings
- Support for multiple months of pairings
- Local storage for persistence
- Responsive design for all screen sizes

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pairing-picker.git
cd pairing-picker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Upload Pairing PDF**
   - Click the "Upload PDF" button
   - Select your pairing PDF file
   - The file will be automatically parsed and displayed

2. **View Pairings**
   - Use the month selector to switch between different months
   - View all pairings in the table format
   - Select specific pairings by clicking on them

3. **Manage Pairings**
   - Selected pairings are automatically saved to local storage
   - You can view and manage your selections across sessions

## Technical Details

- Built with Next.js and TypeScript
- Uses Tailwind CSS for styling
- Implements client-side PDF parsing
- Stores data in browser's local storage
- Responsive design with mobile-first approach

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
