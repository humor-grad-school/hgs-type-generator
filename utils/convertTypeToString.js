function convertTypeToString(type, space) {
  const lines =  JSON.stringify(type, null, 2)
    .replace(/"|'|,/g, '')
    .split('\n');

  lines.pop();
  lines.shift();

  return lines.map((line) => {
      line = `${' '.repeat(space)}${line}`;
      const endOfLine = line.substring(line.length - 2);
      if (endOfLine.match(/[a-z|A-Z|}]/)) {
        return `${line};`;
      }
      return line;
    })
    .join('\n');
}

module.exports = convertTypeToString;