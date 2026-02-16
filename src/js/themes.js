function themes(level) {
  if (level === 1) {
    return 'prairie';
  } else if (level === 2) {
    return 'desert';
  } else if (level === 3) {
    return 'arctic';
  } else return 'mountain'
} 

export default themes;