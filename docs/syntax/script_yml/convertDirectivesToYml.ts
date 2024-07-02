import * as fs from 'fs';


const filePath : string ="./test/test.md";

fs.readFile(filePath,'utf-8',(err,data)=>{
    if(err){
        console.log("Error reading file"+err);
        return;
    }

    const diresctiveRegix=/%%{init:(.*?)\}%%/g;
    const modifiedData= data.replace(diresctiveRegix,(_,directiveContent)=>{
       // Replace single quotes with double quotes and remove outer curly braces
       const jsonContent = directiveContent.replace(/'/g, '"');
        
       // Construct YAML content manually
       const newYamlContent=`{"config":${jsonContent}}`;
       console.log(newYamlContent);
       const yamlContent = jsonToYaml(newYamlContent);
       return `---\n${yamlContent}\n---\n`;  
    });

    fs.writeFile(filePath,modifiedData,'utf-8',(err)=>{
        if(err){
            console.log("Error writing file"+err);
            return;
        }
        console.log("File written successfully");
    })
})


// Convert JSON to YAML manually
function jsonToYaml(jsonContent: string): string {
    const jsonObj = JSON.parse(jsonContent);

    // Helper function to convert an object to YAML
    const objectToYaml = (obj: Record<string, any>, indent: number = 0): string => {
        const lines:string[] = [];
        const spacing = ' '.repeat(indent * 2);

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object') {
                // Recursively convert nested objects to YAML
                const nestedYaml = objectToYaml(value, indent + 1);
                lines.push(`${key}:\n${nestedYaml}`);
            } else {
                lines.push(`${key}: ${value}`);
            }
        }

        return lines.map(line => spacing + line).join('\n');
    };

    const yamlContent = objectToYaml(jsonObj);

    return yamlContent;
}
