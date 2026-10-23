// Serializes an image-reviewed session's authored notes; never generates analyses from captions.
// Usage: npx tsx scripts/maintenance/build-session-analyses.ts <session-directory>
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { CreativeDnaOutput, Perception } from '../../src/lib/creative/schema';
import { validateDna, validatePerception } from '../../src/lib/creative/validate';
import { dominantColours } from '../../src/lib/creative/colours';
import { fingerprint } from '../../src/lib/creative/fingerprint';
import { PROMPT_VERSION, PIPELINE_VERSION } from '../../src/lib/creative/pipeline';
import { TAXONOMY_VERSION } from '../../src/lib/creative/taxonomy';
import type { Manifest } from '../../src/lib/creative/prompt';
const root=process.argv[2];
if(!root) throw new Error('Supply the directory containing reviewed specs, manifests and images');
const manifests: Manifest[]=JSON.parse(await readFile(join(root,'new-manifests.json'),'utf8'));
const specs=JSON.parse(await readFile(join(root,'new-analysis-specs.json'),'utf8'));
const extras=JSON.parse(await readFile(join(root,'new-analysis-extras.json'),'utf8'));
const out=[];
for(const m of manifests){
 const s=specs[m.short_code],e=extras[m.short_code];
 if(!s||!e||s.slides.length!==m.media.expected)throw new Error(`Unreviewed/incomplete: ${m.short_code}`);
 const slides=[];
 for(let i=0;i<s.slides.length;i++){
  const [rawHeadline,rawBody,observation,layout,imagery,role]=s.slides[i];
  const {data,info}=await sharp(join(root,'images',m.short_code,`${String(i).padStart(2,'0')}.webp`)).resize(160,160,{fit:'inside'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  let headline=rawHeadline,body=rawBody;
  if(headline?.length>200){body=[headline,body].filter(Boolean).join('\n');headline=null;}
  slides.push({position:i,role,visible_text:{headline,body},legibility:headline||body?'clear':'no-text',text_density:((headline?.length??0)+(body?.length??0))>250?'high':headline||body?'medium':'none',typography:{classes:headline||body?(s.type??['sans-serif']):['none'],weight:headline||body?'mixed':'none'},layout,imagery,palette:{families:s.palette,hex:dominantColours(data,info.channels,{max:5}).map(c=>c.hex)},devices:[],product_prominence:imagery.includes('product-photography')?'high':'none',people_prominence:imagery.includes('portrait')?'high':imagery.includes('lifestyle-photography')?'medium':'none',objects:[],brand_treatment:e.brand,observation,confidence:'high'});
 }
 const refs=slides.map(x=>`slide:${x.position}`).slice(0,6);
 const perception=Perception.parse({schema_version:'1.0',slides,caption:{hook_text:null,hook_technique:'none',cta:s.cta,tone:s.tone??['playful'],promotional_language:s.cta==='shop',partnership_signals:[],topic:e.topic,audience:null},conflicts:[]});
 const decisions=s.decisions.map((d:string[],i:number)=>({title:d[0],explanation:d[1],observation:d[2],rationale:d[3],principle:d[4],watch_out:null,evidence:e.evidence[i].map((n:number)=>`slide:${n}`),confidence:'high'}));
 const visual={composition:e.composition,typography:e.typography,colour:e.colour,imagery:e.imagery,devices:e.devices,branding:e.brand};
 const dna=CreativeDnaOutput.parse({schema_version:'1.0',taxonomy_version:TAXONOMY_VERSION,primary_archetype:{slug:s.archetype,evidence:refs},secondary_archetypes:[],marketing_objective:{slug:s.goal,evidence:['slide:0','caption']},concept:s.headline,creative_summary:s.summary,content_intent:e.intent,hook:{technique:s.hook,observed_text:slides[0].visible_text.headline,location:slides[0].visible_text.headline?'image':'none',evidence:['slide:0']},visual_system:{composition:slides[0].layout,typography:s.type??['sans-serif'],imagery:slides[0].imagery,palette:s.palette,text_hierarchy:e.typography,decorative_system:e.devices,brand_consistency:e.brand},narrative:{pattern:s.pattern??'single-image',slide_roles:slides.map(x=>({position:x.position,role:x.role})),arc:e.arc},copy_strategy:{tone:s.tone??['playful'],persuasion:s.tone?['empathy','utility']:['humor'],cta:s.cta,complexity:slides.some(x=>x.text_density==='high')?'medium':'low',notes:e.copy},attention_mechanisms:[{statement:e.attention,kind:'observation',evidence:['slide:0']}],creative_rationale:decisions.map((d:any)=>({hypothesis:d.rationale,evidence:d.evidence})),takeaways:e.takeaways,adaptation_ideas:[e.adaptation],constraints_or_uncertainties:s.caveat?[s.caveat]:[],evidence:slides.slice(0,20).map(x=>({ref:`slide:${x.position}`,observation:x.observation,quote:null})),quality:{image_analysis_complete:true,expected_slides:slides.length,processed_slides:slides.length,needs_review:!!s.caveat,uncertainties:[]},creative_decisions:decisions,integrity_notes:s.integrity??[],visual_notes:visual,creative_formula:s.formula,strategy_headline:s.headline,strategy_summary:s.summary,colour_roles:[],copywriting:e.copy,application:{when_to_use:[e.use],when_not_to_use:[e.avoid]}});
 const post={caption:m.caption,expectedSlides:m.media.expected};
 const a=validateDna(dna,post,perception),b=validatePerception(perception,post);
 const errors=[...a.errors,...b.errors],warnings=[...a.warnings,...b.warnings];
 if(errors.length)throw new Error(`${m.short_code}: ${JSON.stringify(errors)}`);
 const inputFingerprint=fingerprint({postId:m.id,caption:m.caption,brand:m.brand.slug??'',category:m.storage_folder??m.category.slug??'',images:m.images.map(i=>({position:i.position,path:i.path,tag:i.etag??`${i.size??0}`})),model:'chatgpt-image-review',promptVersion:PROMPT_VERSION,taxonomyVersion:TAXONOMY_VERSION});
 out.push({post_id:m.id,short_code:m.short_code,content_fingerprint:m.content_fingerprint,pipeline_version:PIPELINE_VERSION,version:{summary:dna.creative_summary,hook:dna.strategy_headline,why_it_works:dna.creative_rationale.map(x=>x.hypothesis).join(' '),takeaways:dna.takeaways,creative_dna:dna,perception,input_fingerprint:inputFingerprint,model_id:'chatgpt-image-review',prompt_version:PROMPT_VERSION,taxonomy_version:TAXONOMY_VERSION,validation:{errors,warnings,method:'session visual review of every stored image'},image_analysis_complete:true,expected_slides:slides.length,processed_slides:slides.length},slides});
}
await writeFile(join(root,'new-analyses.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify({posts:out.length,slides:out.reduce((n,x)=>n+x.slides.length,0),warnings:out.filter(x=>x.version.validation.warnings.length).map(x=>({code:x.short_code,warnings:x.version.validation.warnings}))}));
