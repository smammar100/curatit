// A portable MCP Apps search gallery. The same resource works in ChatGPT and other MCP Apps hosts.
export const SEARCH_WIDGET_URI = "ui://curatit/search-results";
export const SEARCH_WIDGET_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
:root{color-scheme:light dark;font:14px system-ui,-apple-system,sans-serif}*{box-sizing:border-box}
body{margin:0;padding:16px;color:var(--ink,#171717);background:transparent}
h2{font-size:17px;line-height:1.35;margin:0 0 6px;font-weight:700}p{margin:0}
.meta{color:#777;margin-bottom:16px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:14px}
.card{min-width:0;border:1px solid #e6e6e6;border-radius:12px;overflow:hidden;background:#fff;color:#161616;text-decoration:none;display:block}
.cover{width:100%;aspect-ratio:4/5;object-fit:cover;display:block;background:#f3f3f3}
.no-cover{aspect-ratio:4/5;display:flex;align-items:center;justify-content:center;background:#eee;color:#777}
.details{padding:10px}.brand{font-weight:700}.caption{margin-top:4px;font-size:12px;line-height:1.4;color:#666;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.tag{display:inline-block;margin-top:7px;font-size:11px;border-radius:6px;background:#f1f1f1;padding:4px 6px}
@media(prefers-color-scheme:dark){body{--ink:#f2f2f2}.card{background:#222;border-color:#444;color:#f5f5f5}.caption,.meta{color:#aaa}.tag{background:#383838}.no-cover{background:#303030;color:#aaa}}
</style></head>
<body><h2 id="title">Curatit inspiration</h2><p class="meta" id="meta">Searching posts…</p><div id="results" class="grid"></div>
<script>
(function(){
const title=document.getElementById("title"),meta=document.getElementById("meta"),results=document.getElementById("results");
function render(envelope){
 const posts=envelope?.data?.posts;
 if(!Array.isArray(posts))return;
 title.textContent="Curatit search results";
 meta.textContent=posts.length+" real Instagram posts"+(envelope.data.next_cursor?" · more results available":"");
 results.replaceChildren();
 if(!posts.length){meta.textContent="No matching posts. Try another search.";return;}
 for(const p of posts){
  const link=document.createElement("a");link.className="card";
  const url=String(p.source_url||"");if(!/^https:\/\/www\.instagram\.com\/p\/[a-zA-Z0-9_-]+\/?/.test(url))continue;
  link.href=url;link.target="_blank";link.rel="noopener noreferrer";
  const picture= p.thumbnail?.url;
  if(typeof picture==="string" && /^https:\/\/[a-zA-Z0-9.-]+\.supabase\.co\/storage\/v1\//.test(picture)){
   const img=document.createElement("img");img.className="cover";img.src=picture;img.loading="lazy";img.alt="Post by "+(p.brand?.name||"unknown");link.append(img);
  }else{const no=document.createElement("div");no.className="no-cover";no.textContent="No preview";link.append(no);}
  const info=document.createElement("div");info.className="details";
  const brand=document.createElement("div");brand.className="brand";brand.textContent=p.brand?.name||"Instagram";info.append(brand);
  const caption=document.createElement("p");caption.className="caption";caption.textContent=p.caption_excerpt||"";info.append(caption);
  const tag=document.createElement("span");tag.className="tag";tag.textContent=p.format||"post";info.append(tag);
  link.append(info);results.append(link);
 }
}
window.addEventListener("message",e=>{
 if(e.source!==window.parent||e.data?.jsonrpc!=="2.0")return;
 if(e.data.method==="ui/notifications/tool-result")render(e.data.params?.structuredContent);
});
let rpc=1;
window.parent.postMessage({jsonrpc:"2.0",id:rpc,method:"ui/initialize",params:{appInfo:{name:"curatit-search",version:"1.0.0"},appCapabilities:{},protocolVersion:"2026-01-26"}},"*");
window.addEventListener("message",e=>{
 if(e.source!==window.parent||e.data?.jsonrpc!=="2.0"||e.data.id!==rpc||!e.data.result)return;
 window.parent.postMessage({jsonrpc:"2.0",method:"ui/notifications/initialized",params:{}},"*");
},{once:true});
})();
</script></body></html>`;
