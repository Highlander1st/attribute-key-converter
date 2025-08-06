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

      json.forEach(entry => {
        // ✅ Blueprint Name
        if (!blueprintName && entry.Type === "BlueprintGeneratedClass" && entry.Name) {
          blueprintName = entry.Name.replace(/_C$/, "");
        }

        // ✅ Parent Class - multiple strategies
        if (!parentClass && entry.Type === "BlueprintGeneratedClass") {
          // Primary: Super.ObjectName
          const superObj = entry.Super?.ObjectName;
          if (superObj && superObj.includes("'")) {
            const inner = superObj.split("'")[1];
            parentClass = inner.replace(/Default__/, "").replace(/_C$/, "");
          }

          // Fallback: Template.ObjectName
          if (!parentClass && entry.Template?.ObjectName) {
            const template = entry.Template.ObjectName.split("'")[0];
            parentClass = template.replace(/Default__/, "").replace(/_C$/, "");
          }

          // Final Fallback: SuperStruct.ObjectName
          if (!parentClass && entry.SuperStruct?.ObjectName) {
            const structObj = entry.SuperStruct.ObjectName;
            const match = structObj.match(/'(.+?)'/);
            if (match) {
              parentClass = match[1].replace(/_C$/, "").replace("Class", "");
            } else {
              parentClass = structObj.replace("Class", "").replace(/['"]/g, "").replace(/_C$/, "");
            }
          }
        }

        // ✅ Static Mesh (from StaticMeshComponent0)
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

      // ✅ Final Attribute Format
      const attrOutput = attributes.length > 0
        ? `(${attributes.join(",")})`
        : "No AttributeInitKeys found.";

      // ✅ Display outputs
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

// ✅ Copy handler
function copyField(id) {
  const field = document.getElementById(id);
  if (field && field.value) {
    navigator.clipboard.writeText(field.value).then(() => {
      console.log(`Copied from ${id}`);
    }).catch(err => {
      console.error("Clipboard error:", err);
    });
  }
}
