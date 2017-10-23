

# Usage
```
const config = require('hmpo-config');

config.addFile('filename.json');
config.addFile('filename.json5');
config.addFile('filename.yaml');
config.addString('{ config: "value" }');
config.addConfig({ config: 'value' });
config.addScript('config = "value";');

let result = config.toJSON();

```
