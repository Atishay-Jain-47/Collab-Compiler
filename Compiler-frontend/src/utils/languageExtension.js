/**
 * Language name to file extension lookup map.
 */
export const extensions = {
    "CPP": 'cpp',
    "PYTHON": 'py',
    "JAVA": 'java',
    "JAVASCRIPT": 'js',
    "JS": 'js',
    "C": 'c',
    "CSHARP": 'cs',
    "RUBY": 'rb',
    "PHP": 'php',
    "GO": 'go',
    "RUST": 'rs',
    "TYPESCRIPT": 'ts',
    "KOTLIN": 'kt',
    "SWIFT": 'swift',
    "NODEJS": 'js'
};

/**
 * Detects the matching programming language enum string from a filename's extension.
 * Defaults to 'PYTHON' if unknown or extensionless.
 *
 * @param {string} filename Name of the imported/dragged file
 * @returns {string} Normalized language key (e.g. 'PYTHON', 'CPP', 'JAVA', 'GO', 'C', 'JS')
 */
export const detectLanguageFromFilename = (filename) => {
    if (!filename) return "PYTHON";
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
        case 'py': return 'PYTHON';
        case 'cpp':
        case 'cc':
        case 'cxx': return 'CPP';
        case 'c': return 'C';
        case 'java': return 'JAVA';
        case 'go': return 'GO';
        case 'js':
        case 'jsx': return 'JS';
        case 'ts':
        case 'tsx': return 'TYPESCRIPT';
        case 'rs': return 'RUST';
        case 'php': return 'PHP';
        case 'rb': return 'RUBY';
        case 'sh':
        case 'bash': return 'BASH';
        default: return 'PYTHON';
    }
};