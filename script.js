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
      let resourceType = "";

      json.forEach(entry => {
        // ✅ Blueprint Name
        if (!blueprintName && entry.Type === "BlueprintGeneratedClass" && entry.Name) {
          blueprintName = entry.Name.replace(/_C$/, "");
        }

        // ✅ Parent Class (Super, Template, or SuperStruct fallback)
        if (!parentClass && entry.Type === "BlueprintGeneratedClass") {
          const superObj = entry.Super?.ObjectName;
          if (superObj && superObj.includes("'")) {
            const inner = superObj.split("'")[1];
            parentClass = inner.replace(/Default__/, "").replace(/_C$/, "");
          }

          if (!parentClass && entry.Template?.ObjectName) {
            const template = entry.Template.ObjectName.split("'")[0];
            parentClass = template.replace(/Default__/, "").replace(/_C$/, "");
          }

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

        // ✅ Static Mesh
        if (!staticMesh && entry.Type === "StaticMeshComponent" && entry.Name === "StaticMeshComponent0") {
          const meshObj = entry.Properties?.StaticMesh?.ObjectName;
          if (meshObj) {
            const match = meshObj.match(/'(.*?)'/);
            if (match) staticMesh = match[1];
          }
        }

        // ✅ Resource Type (search all values for EFortResourceType::...)
        if (!resourceType && entry.Properties) {
          for (const key in entry.Properties) {
            const value = entry.Properties[key];
            if (typeof value === "string" && value.includes("EFortResourceType::")) {
              const match = value.match(/EFortResourceType::(\w+)/);
              if (match) {
                resourceType = match[1];
                break;
              }
            }
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

      const attrOutput = attributes.length > 0
        ? `(${attributes.join(",")})`
        : "No AttributeInitKeys found.";

      document.getElementById("outputBox").value = attrOutput;
      document.getElementById("blueprintNameBox").value = blueprintName || "Not found";
      document.getElementById("parentClassBox").value = parentClass || "Not found";
      document.getElementById("staticMeshBox").value = staticMesh || "Not found";
      document.getElementById("resourceTypeBox").value = resourceType || "Not found";

    } catch (e) {
      alert("Error processing file. Make sure it's a valid JSON.");
      console.error(e);
    }
  };

  reader.readAsText(fileInput.files[0]);
});

// ✅ Copy field by ID
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
