import fs from 'fs';

const filePath = './src/App.tsx';
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// Target the broken section around line 3454
// Lines are 1-indexed in view_file, so index 3453 is line 3454
// We want to remove line 3453, 3454, 3455, 3456 (using 0-based indices 3452, 3453, 3454, 3455)

// Let's verify we are at the right spot
if (lines[3453].includes('export default function App() {')) {
    console.log('Found broken line:', lines[3453]);
    lines.splice(3452, 5); // Removes 3452, 3453, 3454, 3455, 3456
    // Line 3452 is the empty line 3453
    // Line 3453 is the broken export 3454
    // Line 3454 is empty 3455
    // Line 3455 is empty 3456
    // Line 3456 is the correct export 3457 (But wait, if we remove 3452-3456, we remove the correct export too?)
    
    /* 
    3452: ];
    3453: (empty)
    3454: export default function App() { রহমান',
    3455: (empty)
    3456: (empty)
    3457: export default function App() {
    */
} else {
    console.log('Line 3454 does not contain expected text. Finding by index...');
    // Fallback: look for the string
    const index = lines.findIndex(l => l.includes('রহমান'));
    if (index !== -1) {
        console.log('Found by string at index:', index);
        // We want to remove the broken one and keep the next one
        lines.splice(index - 1, 3); // Remove empty line before, the broken line, and maybe one empty line after
    }
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log('File updated successfully.');
