const fs = require('fs');

const testHtml = `
<!DOCTYPE html>
<html>
<head>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #08080a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
  .section-container {
    position: relative;
    width: 1024px;
    height: 576px;
    overflow: hidden;
    background: #08080a;
  }
  .bg-layer {
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: hidden;
  }
  .bg-img {
    position: absolute;
    top: 0;
    left: 19.5%;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: left center;
    display: block;
    filter: brightness(0.95) contrast(1.15) saturate(1.1);
  }
  .gradient-overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, 
        #08080a 0%, 
        #08080a 32%, 
        rgba(8, 8, 10, 0.95) 42%, 
        rgba(8, 8, 10, 0.8) 48%, 
        rgba(8, 8, 10, 0.3) 62%, 
        rgba(8, 8, 10, 0.05) 76%, 
        transparent 90%
      ),
      linear-gradient(180deg, 
        rgba(8, 8, 10, 0.45) 0%, 
        transparent 15%, 
        transparent 85%, 
        rgba(8, 8, 10, 0.75) 100%
      );
    pointer-events: none;
  }
</style>
</head>
<body>
  <div class="section-container" id="testSec">
    <div class="bg-layer">
      <img class="bg-img" src="/products/jordan_patent.jpg" />
      <div class="gradient-overlay"></div>
    </div>
  </div>
</body>
</html>
`;
fs.writeFileSync('public/test_shoe_perfect.html', testHtml);
console.log('Saved test_shoe_perfect.html with left: 19.5%');
