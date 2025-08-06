document.getElementById('convertButton').addEventListener('click', () => {
  const fileInput = document.getElementById('fileInput');
  if (!fileInput.files[0]) {
    alert("Please upload a JSON file first.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const json = JSON.parse(event.target.result);
      const attributes = [];

      // Look for the object with the AttributeInitKeys
      json.forEach(entry => {
        if (!entry.Properties) return;
        Object.keys(entry.Properties).forEach(key => {
          if (key.startsWith("AttributeInitKeys")) {
            const value = entry.Properties[key];
            const cat = value.AttributeInitCategory;
            const sub = value.AttributeInitSubCategory;
            if (cat && sub) {
              attributes.push(`(AttributeInitCategory="${cat}",AttributeInitSubCategory="${sub}")`);
            }
          }
        });
      });

      if (attributes.length === 0) {
        document.getElementById("outputBox").value = "No AttributeInitKeys found.";
      } else {
        const result = `(${attributes.join(",")})`;
        document.getElementById("outputBox").value = result;
      }
    } catch (e) {
      alert("Error processing file. Make sure it's a valid blueprint JSON.");
    }
  };

  reader.readAsText(fileInput.files[0]);
});

document.getElementById('copyButton').addEventListener('click', () => {
  const output = document.getElementById("outputBox").value;
  if (output) {
    navigator.clipboard.writeText(output);
  }
});
