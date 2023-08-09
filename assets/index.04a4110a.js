var tt=Object.defineProperty;var et=(e,t,n)=>t in e?tt(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var d=(e,t,n)=>(et(e,typeof t!="symbol"?t+"":t,n),n);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function n(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerpolicy&&(o.referrerPolicy=s.referrerpolicy),s.crossorigin==="use-credentials"?o.credentials="include":s.crossorigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(s){if(s.ep)return;s.ep=!0;const o=n(s);fetch(s.href,o)}})();function q(e){return Array.isArray(e)?e.flat():[e]}function nt(...e){return e[0]}function R(e){return e===!1||e===null||e===void 0}function _(e){return typeof e=="function"}function st(e){return e==null}function it(e){const t=e.replace(/[-_\s]+(.)?/g,(n,i)=>i?i.toUpperCase():"");return t[0].toLowerCase()+t.slice(1)}function ot(e){return e.replace(/([a-z])([A-Z])/g,"$1-$2").replace(/\s+/g,"-").toLowerCase()}function rt(e){var t;ct("onDestroy"),(t=k.ref)==null||t.addHook("destroy",e)}function ct(e){if(!k.ref)throw new Error(`"${e}" can only be called within the component function body
      and cannot be used in asynchronous or deferred calls.`)}const T=new Map,$=new WeakMap;let E=null;function lt(){return E?$.get(E):null}function W(e){E=e;const t=$.get(e),n=e(t.iteration);t.iteration++,n&&(t.cleanup=n),E=null}function z(e){if(!E)return;let t=T.get(e);t||(t=new Set,T.set(e,t)),t.add(E)}function G(e){const t=T.get(e);t==null||t.forEach(n=>W(n))}function w(e,t){$.set(e,{iteration:0,options:t!=null?t:{}}),W(e);const n=()=>{var i,s;(s=(i=$.get(e)).cleanup)==null||s.call(i),$.delete(e);for(const[o,r]of T.entries())r.delete(e),r.size===0&&T.delete(o)};return k.ref&&rt(n),n}function at(e,t){let n,i=(o,r)=>o===r;t===!1?i=()=>!1:t&&(i=t);const s=()=>(z(s),n);return w(()=>{const o=e();i(n,o)||(n=o,G(s))}),s}class ut extends Function{constructor(t){return super(),Object.setPrototypeOf(t,new.target.prototype)}}class U extends ut{constructor(n,i){super(()=>(z(this),this.value));d(this,"equal");d(this,"value");i===!1?this.equal=()=>!1:i&&(this.equal=i),this.value=n}asReadonly(){return()=>this()}mutate(n){n(this.value),G(this)}set(n){var s;((s=this.equal)!=null?s:(o,r)=>o===r)(this.value,n)||(this.value=n,this.mutate(()=>{}))}update(n){this.set(n(this.value))}}function m(e,t){return new U(e,t)}function F(e){return e instanceof U}class D{constructor(){d(this,"listener",()=>{});d(this,"emitter");const t=this.emit.bind(this);t.type="output",this.emitter=t}setListener(t){this.listener=t}emit(t){const n=lt();(!n||n.options.allowEmitsOnFirstRun||n.iteration>0)&&this.listener(t)}}function H(){return new Proxy({},{getPrototypeOf:nt,get(e,t){var s;const n=`bind:${t}`,i=(s=e[n])!=null?s:e[t];return i instanceof D?i.emitter:F(i)?i():i},set(e,t,n){const i=`bind:${t}`,s=e[i];return F(s)?(s.set(n),!0):!1}})}const L=class{constructor(t,n){d(this,"proxyProps",H());d(this,"root",null);d(this,"trackMap",new Map);d(this,"hooks",{destroy:new Set,init:new Set});this.template=t,this.props=n}get firstChild(){var t,n;return(n=(t=this.root)==null?void 0:t.firstChild)!=null?n:null}get isConnected(){var t,n;return(n=(t=this.root)==null?void 0:t.isConnected)!=null?n:!1}addHook(t,n){var i;(i=this.hooks[t])==null||i.add(n)}mount(t,n=null){var s,o;if(!_(this.template))throw new Error("Component template must be a function");if(this.isConnected)return(o=(s=this.root)==null?void 0:s.mount(t,n))!=null?o:[];this.patchProps(this.props),L.ref=this,this.root=this.template.call(this.proxyProps),L.ref=null,this.template.hasOwnProperty("styleId")&&(this.root.styleId=this.template.styleId);const i=this.root.mount(t,n);return this.hooks.init.forEach(r=>r()),i}unmount(){var t;this.hooks.destroy.forEach(n=>n()),this.hooks.destroy.clear(),this.hooks.init.clear(),this.trackMap.forEach(n=>n.cleanup()),this.trackMap.clear(),(t=this.root)==null||t.unmount(),this.root=null,this.proxyProps=H()}patchProps(t){var i;const n=Object.getPrototypeOf(this.proxyProps);this.props=t;for(let s in t)if(s.startsWith("on:")){const o=s.slice(3),r=t[s];(!n[o]||F(n[o]))&&(n[o]=new D),n[o].setListener(r)}else if(s.startsWith("bind:"))n[s]=t[s];else{const o=t[s],r=this.getNodeTrack(s),l=(i=n[s])!=null?i:n[s]=m(void 0);r.cleanup=w(()=>{l.set(_(o)?o():o)})}}getNodeTrack(t){let n=this.trackMap.get(t);return n||(n={cleanup:()=>{}},this.trackMap.set(t,n)),n.cleanup(),n}};let k=L;d(k,"ref",null);function J(e,t,n){return e.addEventListener(t,n),()=>e.removeEventListener(t,n)}function B(e){if(v(e)||e instanceof Node)return e;const t=R(e)?"":String(e);return document.createTextNode(t)}function y(e,t,n=null){const i=v(n)?n.firstChild:n;v(t)?t.mount(e,i):i?e.insertBefore(t,i):e.appendChild(t)}function C(e){if(v(e))e.unmount();else{const t=e.parentNode;t&&t.removeChild(e)}}function Q(e,t,n){y(e,t,n),C(n)}function K(e,t,n){if(t==="class"){typeof n=="string"?e.className=n:Array.isArray(n)?e.className=n.join(" "):n&&typeof n=="object"&&(e.className=Object.entries(n).reduce((i,[s,o])=>i+(o?` ${s}`:""),"").trim());return}if(t.startsWith("class:")){const i=t.substring(6);R(n)?e.classList.remove(i):e.classList.add(i);return}if(t==="style"){if(typeof n=="string")e.style.cssText=n;else if(n&&typeof n=="object"){const i=n;Object.keys(n).forEach(s=>{e.style.setProperty(ot(s),String(i[s]))})}return}if(t.startsWith("style:")){const i=it(t.substring(6));if(i in e.style){const s=i;e.style[s]=String(n)}return}R(n)?e.removeAttribute(t):n===!0?e.setAttribute(t,""):e.setAttribute(t,String(n))}function ft(e,t,n){const i=V(e,t,n);e instanceof HTMLInputElement&&(e.type==="checkbox"&&i("change",()=>e.checked,s=>e.checked=Boolean(s)),e.type==="date"&&i("change",()=>e.valueAsDate,s=>e.value=s?s.toISOString().slice(11,16):""),e.type==="file"&&i("change",()=>e.files),e.type==="number"&&i("input",()=>e.valueAsNumber,s=>{var o;return e.value=(o=String(s))!=null?o:""}),e.type==="radio"&&i("change",()=>e.checked,s=>e.checked=e.value===String(s)),e.type==="text"&&i("input",()=>e.value,s=>e.value=String(s))),e instanceof HTMLSelectElement&&i("change",()=>{var s;return(s=e.options.item(e.selectedIndex))==null?void 0:s.value},s=>e.selectedIndex=Array.from(e.options).findIndex(o=>o.value===s)),e instanceof HTMLTextAreaElement&&i("input",()=>e.value,s=>e.value=String(s))}function V(e,t,n){return(i,s,o)=>{const r=J(e,i,()=>t.set(s()));if(n&&(n.cleanup=r),o){const l=w(()=>o(t()));n&&(n.cleanup=()=>{r(),l()})}}}function dt(e,t,n,i){const s=new Map,o=t.values();if(t.size>0&&n.length===0){if(e.childNodes.length===t.size+(i?1:0))e.innerHTML="",i&&y(e,i);else{const c=document.createRange(),a=o.next().value,f=v(a)?a.firstChild:a;c.setStartBefore(f),i?c.setEndBefore(i):c.setEndAfter(e),c.deleteContents()}return t.forEach(c=>{v(c)&&c.unmount()}),s}const r=[],l=pt(n);for(let c=0;c<n.length;c++){let a=o.next().value,f=P(a,c);for(;a&&!l.has(f);)C(a),t.delete(f),a=o.next().value,f=P(a,c);let p=n[c];const g=P(p,c),b=t.get(g);if(b&&(p=ht(e,b,p)),a){if(a!==b)if(a){const x=document.createComment("");y(e,x,a),r.push([x,p])}else y(e,p,i)}else y(e,p,i);s.set(g,p)}return r.forEach(([c,a])=>Q(e,a,c)),t.forEach((c,a)=>{c.isConnected&&!s.has(a)&&C(c)}),s}function ht(e,t,n){return t===n?t:v(t)&&v(n)&&t.template===n.template?(t.patchProps(n.props),t):t instanceof Text&&n instanceof Text?(t.textContent!==n.textContent&&(t.textContent=n.textContent),t):(Q(e,n,t),n)}function pt(e){const t=new Map;for(let n=0;n<e.length;n++){const i=e[n],s=P(i,n);t.set(s,i)}return t}function P(e,t){const n=e==null?void 0:e.id;let i=n===""?void 0:n;return i!=null?i:`_$${t}$`}class I{constructor(t,n){d(this,"mounted",!1);d(this,"nodes",[]);d(this,"styleId");d(this,"trackMap",new Map);d(this,"treeMap",new Map);this.template=t,this.props=n}get firstChild(){var t;return(t=this.nodes[0])!=null?t:null}get isConnected(){return this.mounted}mount(t,n=null){var o;if(this.isConnected)return this.nodes.forEach(r=>y(t,r,n)),this.nodes;const i=this.template.content.cloneNode(!0),s=i.firstChild;return(o=s==null?void 0:s.hasAttribute)!=null&&o.call(s,"_tmpl_")&&(i.removeChild(s),Array.from(s.childNodes).forEach(r=>i.appendChild(r))),this.nodes=Array.from(i.childNodes),this.mapNodeTree(t,i),y(t,i,n),this.patchProps(this.props),this.mounted=!0,this.nodes}unmount(){this.trackMap.forEach(t=>{var n;t.cleanup(),(n=t.lastNodes)==null||n.forEach(i=>{t.isRoot?C(i):i instanceof I&&i.unmount()})}),this.trackMap.clear(),this.treeMap.clear(),this.nodes.forEach(t=>C(t)),this.nodes=[],this.mounted=!1}patchProps(t){this.props=t;for(let n in t){const i=Number(n),s=this.treeMap.get(i);if(s){const o=t[n];this.patchNode(n,s,o,i===0)}}}getNodeTrack(t,n,i){let s=this.trackMap.get(t);return s||(s={cleanup:()=>{}},n&&(s.lastNodes=new Map),i&&(s.isRoot=!0),this.trackMap.set(t,s)),s.cleanup(),s}mapNodeTree(t,n){let i=1;this.treeMap.set(0,t);const s=o=>{var l;o.nodeType!==Node.DOCUMENT_FRAGMENT_NODE&&this.treeMap.set(i++,o);let r=o.firstChild;for(;r;)s(r),r=r.nextSibling;this.styleId&&((l=o.setAttribute)==null||l.call(o,`_${this.styleId}`,""))};s(n)}patchNode(t,n,i,s){for(let o in i)if(o==="children"&&i.children)i.children.forEach(([r,l],c)=>{var g;const a=st(l)?null:(g=this.treeMap.get(l))!=null?g:null,f=`${t}:${o}:${c}`,p=this.getNodeTrack(f,!0,s);gt(p,n,r,a)});else if(o==="ref"&&i.ref)_(i.ref)&&i.ref(n);else if(o==="bind"&&i.bind){const r=this.getNodeTrack(`${t}:${o}`);ft(n,i.bind,r)}else if(t.startsWith("bind:")){const r=t.slice(5),l=i[o],c=this.getNodeTrack(`${t}:${o}`);V(n,l,c)("change",()=>n[r],f=>n[r]=f)}else if(o.startsWith("on:")){const r=o.substring(3),l=this.getNodeTrack(`${t}:${o}`),c=i[o];l.cleanup=J(n,r,c)}else{const r=this.getNodeTrack(`${t}:${o}`),l=i[o];mt(r,n,o,l)}}}function mt(e,t,n,i){const s=t;!s.setAttribute||(_(i)?e.cleanup=w(()=>{K(s,n,i())}):K(s,n,i))}function gt(e,t,n,i){_(n)?e.cleanup=w(()=>{const s=q(n()).map(B);e.lastNodes=dt(t,e.lastNodes,s,i)}):q(n).forEach((s,o)=>{const r=B(s);e.lastNodes.set(String(o),r),y(t,r,i)})}function u(e,t){return _(e)?new k(e,t):new I(e,t)}function v(e){return e instanceof k||e instanceof I}function h(e){const t=document.createElement("template");return t.innerHTML=e,t}function bt(e){return{state:e}}function yt(...e){const t={},n=m({}),i={},s=o=>{n.update(o)};for(const o of e)o.state&&Object.assign(t,o.state);s(()=>t);for(const o in t)i[o]=at(()=>n()[o]);return[i,s]}const[{url:kt,href:te,fragment:ee,queryParams:ne,state:vt},Z]=yt(bt(j()));typeof window<"u"&&window.addEventListener("popstate",()=>{Z(({state:e})=>j(e))});function j(e={}){return{url:window.location.pathname,href:window.location.href,fragment:window.location.hash,queryParams:new URLSearchParams(window.location.search),state:e}}function wt(e,t){const{replace:n=!1,state:i=vt()}=t!=null?t:{},s=n?"replaceState":"pushState";window.history[s](i,"",e),Z(({state:o})=>j({...o,...i}))}const xt=h("<a></a>");function M(){return u(xt,{1:{children:[[()=>this.children,null]],href:()=>this.to.replace(/^\//,""),"on:click":e=>{e.preventDefault(),wt(this.to.replace(/^\//,""))}}})}function _t(){const e=(t,n,i="/")=>{const s=new RegExp(`^${i}`);if(!t||typeof t!="object"||!s.test(n))return null;const[o,r]=n.replace(new RegExp(`^${i}`),"/").split("?");for(const[l,c]of Object.entries(t)){const a=[],f=l.split("/").map(b=>{var S;const[,x,A,O]=(S=/^(:)?([^\?]+)(\?)?/.exec(b))!=null?S:[];return x?(a.push(A),"([^/]+)"+(O?"?":"")):b}),g=new RegExp(`^${f.join("/")}$`).exec(o);if(g!==null){const b=g.slice(1).reduce((A,O,S)=>(a[S]&&(A[a[S]]=O),A),{}),x=r?new URLSearchParams(r):new URLSearchParams;return typeof c=="function"?c(b,x):c}}return null};return u(h(""),{0:{children:[[()=>e(this.routes,kt(),this.base),null]]}})}function N(e,t){return{path:e,route:t}}function Et(...e){return e.reduce((t,n)=>(t[n.path]=n.route,t),{})}function X(e,t){if(!t)throw new Error("id is required");return(n,...i)=>{const s=Array.from(n),o=document.createElement("style"),r=i.reduce((c,a,f)=>c+String(a)+s[f+1],s[0]);o.setAttribute("type","text/css"),o.textContent=r,document.head.append(o);const l=function(){return e.apply(this,arguments)};return l.styleId=t,l}}const St="_even_776kc_1",Nt="_odd_776kc_4",$t={even:St,odd:Nt},Tt=h('<h1 style="color:red;">Children Test</h1><div class="actions"><button>Append item</button><button>Prepend item</button><button>Remove item</button><button>Shuffle list</button><button><!> odds</button><button>Log</button></div><ul class="list"><li>Header</li><!><li>Footer</li></ul>'),Ct=h("<li>Item </li>");function At(){const e=m([]),t=m(!0);let n=0;return u(Tt,{4:{"on:click":()=>{e.mutate(c=>c.push(++n))}},6:{"on:click":()=>{e.mutate(c=>c.unshift(++n))}},8:{"on:click":()=>{e.update(c=>c.slice(0,-1))}},10:{"on:click":()=>{e.mutate(c=>c.sort(()=>Math.random()-.5))}},12:{"on:click":()=>{t.update(c=>!c)},children:[[()=>t()?"Hide":"Show",13]]},15:{"on:click":()=>console.log(e())},17:{"class:has-item":()=>e().length,children:[[()=>e().map(c=>{const a=c%2===0?"even":"odd";return t()||a==="even"?u(Ct,{1:{class:()=>$t[a],children:[[()=>c,null]]}}):null}),20]]}})}const Mt=h("<button><!><span></span></button>"),Pt=h("<i></i>");function Y(){return u(Mt,{1:{disabled:()=>this.disabled,"on:click":()=>{var e;return(e=this.click)==null?void 0:e.call(this)},children:[[()=>this.icon&&u(Pt,{1:{class:()=>`fa-solid fa-${this.icon}`}}),2]]},3:{children:[[()=>this.children,null]]}})}const Lt="_card_1l3tk_1",It={card:Lt},Ot=h('<div><div><a target="_blank"></a><span>\u{1F31F}</span><strong></strong></div><p></p></div>');function Rt(){return u(Ot,{1:{class:()=>It.card,children:[[()=>u(Y,{"on:click":()=>this.remove(this.item),children:()=>"Remove"}),null]]},3:{href:this.item.html_url,children:[[()=>this.item.full_name,null]]},6:{children:[[()=>this.item.stargazers_count,null]]},7:{children:[[()=>this.item.description,null]]}})}const Ft=h('<h1 style="color:blue;">Github Example</h1><div><label for="search">Search:</label><input id="search" placeholder="Search for github repository..."/></div><div><span><!> repository results</span></div><div class="list"></div>'),jt="//api.github.com/search/repositories";function qt(){const e=m(!1),t=m([]),n=m("");w(()=>{n().length>2&&(e.set(!0),fetch(`${jt}?q=${n()}`).then(o=>o.json()).then(o=>{var r;t.set((r=o==null?void 0:o.items)!=null?r:[]),e.set(!1)}))});function i(o){t.update(r=>r.filter(l=>l!==o))}function s(){t.mutate(o=>o.sort(()=>Math.random()-.5))}return u(Ft,{6:{bind:n},7:{children:[[()=>u(Y,{disabled:()=>t().length===0,"on:click":s,children:()=>"Shuffle"}),null]]},8:{children:[[()=>t().length,9]]},11:{"class:has-items":()=>t().length>0,children:[[()=>e()?"loading...":t().map(o=>u(Rt,{item:()=>o,"on:remove":i},o.id)),null]]}})}const Ht=h('<div class="todo"><input type="checkbox"/><span></span><button>\u{1F5D1}\uFE0F</button></div>');function Bt(){const e=m(this.todo.completed);return w(()=>{this.complete(e())}),u(Ht,{2:{bind:e},3:{"class:completed":()=>e(),children:[[()=>this.todo.text,null]]},4:{"on:click":()=>{var t;return(t=this.remove)==null?void 0:t.call(this,this.todo)}}})}const Kt=X(Bt,"lb001")`
  .todo[_lb001] {
    display: flex;
    align-items: center;
    -moz-column-gap: 8px;
         column-gap: 8px;
    padding: 14px;
  }

    .todo[_lb001] + .todo[_lb001] {
      border-top: 1px solid #ccc;
    }

    .todo[_lb001] span[_lb001] {
      flex: 1;
    }

    .todo[_lb001] span[_lb001].completed[_lb001] {
        text-decoration: line-through;
      }

    .todo[_lb001] input[_lb001] {
      cursor: pointer;
    }

    .todo[_lb001] button[_lb001] {
      border: none;
      background: none;
      cursor: pointer;
    }
`,Wt=h('<div class="header"><h1>Estrela Todo App</h1></div><div class="container"><div class="add-todo"><input placeholder="Enter todo"/><button>\u2795</button></div><div class="todos"></div></div>');function zt(){const e=m([]),t=m("");let n=0;const i=localStorage.getItem("todos");i&&(e.set(JSON.parse(i)),n=e().reduce((l,c)=>Math.max(l,c.id+1),0)),w(()=>{localStorage.setItem("todos",JSON.stringify(e()))});const s=()=>{if(t()){const l={id:n++,text:t(),completed:!1};e.mutate(c=>c.push(l)),t.set("")}},o=l=>c=>{e.mutate(a=>{const f=a.find(p=>p.id===l);f&&(f.completed=c)})},r=l=>()=>{e.update(c=>c.filter(a=>a.id!==l))};return u(Wt,{6:{bind:t,"on:keydown":l=>l.key==="Enter"&&s()},7:{disabled:()=>!t(),"on:click":s},9:{"class:empty":()=>e.length===0,children:[[()=>e().map(l=>u(Kt,{todo:()=>l,"on:complete":o(l.id),"on:remove":r(l.id)},l.id)),null]]}})}const Gt=X(zt,"fbk5r")`
  .header[_fbk5r] {
    display: flex;
    justify-content: center;
    background-color: #009dff;
    padding: 20px;
    height: 80px;
  }

    .header[_fbk5r] h1[_fbk5r] {
      color: white;
      margin: 0;
    }

  .container[_fbk5r] {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    max-width: 500px;
    padding: 20px;
    margin: 0 auto;
  }

  .container[_fbk5r] .add-todo[_fbk5r] {
      display: flex;
      align-items: stretch;
      border: 1px solid #ccc;
      border-radius: 4px;
      overflow: hidden;
      height: 40px;
    }

  .container[_fbk5r] .add-todo[_fbk5r] input[_fbk5r] {
        flex: 1;
        border: none;
        background: transparent;
        padding: 0 10px;
      }

  .container[_fbk5r] .add-todo[_fbk5r] button[_fbk5r] {
        border: none;
        cursor: pointer;
        width: 40px;
      }

  .container[_fbk5r] .todos[_fbk5r] {
      display: flex;
      flex-direction: column;
      margin-top: 10px;
    }

  .container[_fbk5r] .todos[_fbk5r]:not(.empty) {
        border: 1px solid #ccc;
        border-radius: 4px;
      }
`,Ut=h('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="yellow"></circle><!><path d="M30 60 Q50 80, 70 60" fill="none" stroke="black"></path></svg>'),Dt=h('<svg _tmpl_><circle cy="40" r="5" fill="black"></circle>');function Jt(){return u(Ut,{1:{children:[[()=>[35,65].map((e,t)=>u(Dt,{1:{cx:()=>e}})),3]]}})}const Qt=h("<h1>Examples</h1><ul><li></li><li></li><li></li><li></li></ul>"),Vt=Et(N("/",()=>u(Zt,{})),N("/github",()=>u(qt,{})),N("/svg",()=>u(Jt,{})),N("/test",()=>u(At,{})),N("/todo",()=>u(Gt,{})));function Zt(){return u(Qt,{4:{children:[[()=>u(M,{to:"/test",children:()=>"Test"}),null]]},5:{children:[[()=>u(M,{to:"/svg",children:()=>"SVG Test"}),null]]},6:{children:[[()=>u(M,{to:"/github",children:()=>"Github"}),null]]},7:{children:[[()=>u(M,{to:"/todo",children:()=>"Todo App"}),null]]}})}function Xt(){return u(_t,{base:"/estrela/",routes:()=>Vt})}u(Xt,{}).mount(document.getElementById("app"));
