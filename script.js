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

      let blueprintName = "";
      let parentClass = "";
      let staticMesh = "";

      // Primary scan
      json.forEach(entry => {
        // ✅ Blueprint Name
        if (!blueprintName && entry.Type === "BlueprintGeneratedClass" && entry.Name) {
          blueprintName = entry.Name.replace(/_C$/, "");
        }

        // ✅ Parent Class - Primary Method (SuperStruct)
        if (!parentClass && entry.Type === "BlueprintGeneratedClass" && entry.Super && entry.Super.ObjectName) {
          const match = entry.Super.ObjectName.match(/'(.*?)'/);
          if (match) {
            parentClass = match[1].replace(/^Class'/, "").replace(/_C$/, "");
          }
        }

        // ✅ Static Mesh
        if (!staticMesh && entry.Type === "StaticMeshComponent" && entry.Name === "StaticMeshComponent0") {
          const meshObj = entry.Properties?.StaticMesh?.ObjectName;
          if (meshObj) {
            const match = meshObj.match(/'(.*?)'/);
            if (match) staticMesh = match[1];
          }
        }

        // ✅ Attribute Keys
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

      // ✅ Fallback Method for Parent Class
      if (!parentClass) {
        json.forEach(entry => {
          if (entry.Type && entry.Type.endsWith("_C") && entry.Class) {
            const match = entry.Class.match(/\.([^.']+)_C'?$/);
            if (match) {
              parentClass = match[1];
            }
          }
        });
      }

      // ✅ Final Output
      const attrOutput = attributes.length > 0
        ? `(${attributes.join(",")})`
        : "No AttributeInitKeys found.";

      document.getElementById("outputBox").value = attrOutput;
      document.getElementById("blueprintNameBox").value = blueprintName || "Not found";
      document.getElementById("parentClassBox").value = parentClass || "Not found";
      document.getElementById("staticMeshBox").value = staticMesh || "Not found";

    } catch (e) {
      alert("Error processing file. Make sure it's a valid JSON.");
      console.error(e);
    }
  };

  reader.readAsText(fileInput.files[0]);
});

function copyField(id) {
  const field = document.getElementById(id);
  if (field && field.value) {
    navigator.clipboard.writeText(field.value);
  }
}
