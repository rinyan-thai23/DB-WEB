export function setupSearch(locale){
 const input=document.getElementById('search');if(!input)return;
 let category='all';
 const cards=[...document.querySelectorAll('[data-search]')];
 const normalize=s=>s.normalize('NFKC').toLocaleLowerCase(locale.lang).trim();
 function filter(){let count=0;const query=normalize(input.value);for(const card of cards){const show=(category==='all'||card.dataset.category===category)&&normalize(card.dataset.search).includes(query);card.hidden=!show;if(show)count++}document.getElementById('count').textContent=`${count} ${locale.count}`;document.getElementById('empty').hidden=count!==0;}
 input.addEventListener('input',filter);
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filter()}));
}
