function parseDoubleEscaped(str) {
  if (typeof str !== 'string') return str;

  try {
    // Step 1: Parse the outer string if it is stringified/escaped
    let parsed = JSON.parse(str);
    
    // Step 2: If the parsed result is still a string, it means it was double-stringified
    if (typeof parsed === 'string') {
      let clean = parsed.trim();
      if (clean.includes('}{')) {
        clean = clean.split('}{')[0] + '}';
      }
      return JSON.parse(clean);
    }
    
    // If it parsed directly into an object, check if it was concatenated (though usually JSON.parse throws on concatenated objects)
    return parsed;
  } catch (e) {
    // Fallback: If initial JSON.parse failed, the string might not be wrapped in outer quotes but still contain escape sequences and concatenated objects.
    try {
      let unescaped = str;
      if (unescaped.startsWith('"') && unescaped.endsWith('"')) {
        unescaped = unescaped.substring(1, unescaped.length - 1);
      }
      unescaped = unescaped.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      
      if (unescaped.includes('}{')) {
        unescaped = unescaped.split('}{')[0] + '}';
      }
      
      return JSON.parse(unescaped);
    } catch (innerErr) {
      throw new Error(`Failed to parse: ${str} -> ${innerErr.message}`);
    }
  }
}

const testVal1 = "\"{\\\"id\\\": \\\"theme_sakura\\\", \\\"name\\\": \\\"Hoa Anh Đào\\\", \\\"colors\\\": {\\\"accent\\\": \\\"#fbcfe8\\\"}, \\\"glassGlowIntensity\\\": 0.2}{\\\"required_level\\\": 10}\"";
console.log('Result 1:', parseDoubleEscaped(testVal1));
