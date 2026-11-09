function initSunWorldCase(section, {prefix, name, articles, groups}) {
  if (!section) return;
  const query = selector => section.querySelector(selector.replaceAll('#sw-', '#'+prefix+'-'));
  const tabs = [...section.querySelectorAll('[data-challenge]')];
  const postButtons = [...section.querySelectorAll('[data-post]')];
  const story = query('#sw-story');
  const pair = query('.sw-pair');
  const artwork = query('#sw-artwork');
  const caption = query('#sw-caption');
  const readLink = query('#sw-read-post');
  const dialog = document.querySelector('#sw-lightbox');
  const asset = name => `assets/projects/sunworld/${name}.webp`;
  let groupIndex = 0, postIndex = 0, revision = 0;
  const selectedArticle = () => articles[groups[groupIndex].posts[postIndex]];
  function selectPost(index, animate = true) {
    if (index >= groups[groupIndex].posts.length) return;
    postIndex = index;
    const article = selectedArticle();
    const thisRevision = ++revision;
    artwork.loading = animate ? 'eager' : 'lazy'; caption.loading = animate ? 'eager' : 'lazy';
    artwork.src = asset(article.art); artwork.alt = article.artAlt;
    caption.src = asset(article.caption); caption.alt = article.captionAlt;
    readLink.href = article.url;
    postButtons.forEach((button, i) => {
      button.hidden = i >= groups[groupIndex].posts.length;
      button.setAttribute('aria-pressed', String(i === index));
      button.textContent = articles[groups[groupIndex].posts[i]]?.label || 'Bài '+String(i+1).padStart(2,'0');
    });
    pair.setAttribute('aria-busy','true');
    Promise.all([artwork.decode().catch(()=>{}), caption.decode().catch(()=>{})]).then(() => {
      if (thisRevision !== revision) return;
      pair.removeAttribute('aria-busy');
      if (animate) motionReveal(pair, 'zoom', {duration:450});
    });
  }
  function setHighlightedCopy(element, text, keys) {
    const phrases = Array.isArray(keys) ? keys : [keys];
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    while (cursor < text.length) {
      const match = phrases.filter(Boolean).map(key=>({key,index:text.indexOf(key,cursor)})).filter(m=>m.index>=0).sort((a,b)=>a.index-b.index)[0];
      if (!match) { fragment.append(document.createTextNode(text.slice(cursor))); break; }
      fragment.append(document.createTextNode(text.slice(cursor,match.index)));
      const strong=document.createElement('strong');strong.textContent=match.key;fragment.append(strong);
      cursor=match.index+match.key.length;
    }
    element.replaceChildren(fragment);
  }
  function selectChallenge(index, focus = false, animate = true) {
    groupIndex = index;
    tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
    if (tabs[index]) story.setAttribute('aria-labelledby',tabs[index].id);
    setHighlightedCopy(query('#sw-problem'), groups[index].problem, groups[index].problemKey);
    setHighlightedCopy(query('#sw-approach'), groups[index].approach, groups[index].approachKey);
    selectPost(0, animate);
    if (animate) motionReveal(query('.sw-problem-card'), 'side', {direction:-1,duration:450});
    if (animate) motionReveal(query('.sw-approach'), 'fade', {delay:70,duration:500});
    if (animate) query('.sw-approach').querySelectorAll('strong').forEach(n=>motionReveal(n, 'underline', {delay:180,duration:650}));
    if (focus && tabs[index]) tabs[index].focus();
  }
  selectChallenge(0, false, false);
  tabs.forEach((tab, i) => {
    tab.addEventListener('click',()=>selectChallenge(i));
    tab.addEventListener('keydown',event=>{
      let index;
      if (event.key==='ArrowRight'||event.key==='ArrowLeft') index = (groupIndex + (event.key==='ArrowRight' ? 1 : groups.length-1)) % groups.length;
      if (event.key==='Home') index=0;
      if (event.key==='End') index=groups.length-1;
      if (index===undefined) return;
      event.preventDefault();selectChallenge(index,true);
    });
  });
  postButtons.forEach((button, i)=>button.addEventListener('click',()=>selectPost(i)));
  pair.addEventListener('click',()=>{
    const article = selectedArticle();
    const fullArt = dialog.querySelector('#sw-full-artwork');
    const fullCaption = dialog.querySelector('#sw-full-caption');
    fullArt.src = asset(article.art); fullArt.alt = article.artAlt;
    fullCaption.src = asset(article.caption); fullCaption.alt = article.captionAlt;
    dialog.querySelector('#sw-full-link').href = article.url;
    dialog.querySelector('#sw-lightbox-title').textContent = `${name} · ${article.label || 'Bài '+String(postIndex+1).padStart(2,'0')}`;
    dialog.showModal();
    motionReveal(dialog, 'zoom', {duration:300});
    document.body.classList.add('sw-dialog-open');
  });

  onEntrance(section,()=>{
    motionReveal(query('.sw-case-heading'),'side',{direction:-1,duration:650});
    motionReveal(query('.sw-challenges'),'side',{delay:80,duration:600});
    motionReveal(query('.sw-problem-card'),'side',{delay:100,direction:-1});
    motionReveal(query('.sw-approach'),'rise',{delay:160});
    motionReveal(query('.sw-metal-disc'),'metal',{delay:220,duration:1000});
    query('.sw-approach').querySelectorAll('strong').forEach(n=>motionReveal(n,'underline',{delay:250,duration:700}));
    motionReveal(query('.sw-evidence'),'side',{delay:140,direction:1,duration:750});
  });
}
(() => {
  const articles = [
    {art:'bnh.1.1', caption:'bnh.1.2', preview:'bnh.1.1-preview', artAlt:'Infographic tháng 3 Bà Nà có gì đặc biệt', captionAlt:'Nội dung bài đăng tháng 3 Bà Nà có gì đặc biệt', url:'https://www.facebook.com/share/p/1EkauoW9mB/'},
    {art:'bnh.1.3', caption:'bnh.1.4', preview:'bnh.1.3-preview', artAlt:'Infographic menu nhà hàng buffet tại Bà Nà', captionAlt:'Nội dung bài đăng về buffet Bà Nà', url:'https://www.facebook.com/share/p/1FcQyQzp3k/'},
    {art:'bnh.2.1', caption:'bnh.2.2', preview:'bnh.2.1-preview', artAlt:'Thiết kế Bà Nà ngày giải phóng 30 tháng 4', captionAlt:'Nội dung bài đăng theo cách tiếp cận Thời báo Bà Nà', url:'https://www.facebook.com/SunWorldBaNaHills/posts/pfbid02pUtrJnYL3JTC3w9LEG6y2M9ZRb6zA28fMAQfnZHeiG8vX4NzWxMuWWTGsxCA95Gl'}
  ];
  const groups = [
    {problem:'Bà Nà có rất nhiều trải nghiệm, nên lượng thông tin cần truyền tải rất lớn.', problemKey:'rất nhiều trải nghiệm', approach:'Bổ sung các tuyến bài infographic trực quan, hữu ích và cô đọng cho khán giả.', approachKey:'infographic trực quan', posts:[0,1]},
    {problem:'Bà Nà có nhiều sản phẩm lâu đời, nên luôn cần làm mới những trải nghiệm quen thuộc đó.', problemKey:'làm mới những trải nghiệm quen thuộc', approach:'Chọn cách thức mới hơn và sáng tạo hơn để tiếp cận khán giả.', approachKey:'mới hơn và sáng tạo hơn', posts:[2]}
  ];

  initSunWorldCase(document.querySelector('#bana-case'),{prefix:'sw',name:'Bà Nà Hills',articles,groups});
})();
initSunWorldCase(document.querySelector('#catba-case'),{
  "prefix": "cb",
  "name": "Cát Bà",
  "articles": [
    {
      "art": "cb.1.1",
      "caption": "cb.1.2",
      "artAlt": "Hình minh họa 7 chương nghệ thuật của Symphony of the Green Island",
      "captionAlt": "Nội dung bài viết về 7 chương nghệ thuật của Symphony of the Green Island",
      "url": "https://www.facebook.com/share/p/1EpodTa79Y/"
    },
    {
      "art": "cb.2.1",
      "caption": "cb.2.2",
      "artAlt": "Hình minh họa từ bản nháp đến sân khấu Symphony of the Green Island",
      "captionAlt": "Nội dung bài viết từ bản nháp đến thực tế của Symphony of the Green Island",
      "url": "https://www.facebook.com/share/p/1FW81wAqUa/"
    },
    {
      "art": "cb.3.1",
      "caption": "cb.3.2",
      "artAlt": "Hình minh họa các ngôi sao thế giới của Symphony of the Green Island",
      "captionAlt": "Nội dung bài viết về đội ngũ quốc tế của Symphony of the Green Island",
      "url": "https://www.facebook.com/share/p/1LdrKRyiWw/"
    }
  ],
  "groups": [
    {
      "problem": "SOTGI là show diễn tầm cỡ với rất nhiều lớp lang nghệ thuật và pháo hoa kết màn mãn nhãn. Tuy nhiên, khán giả có thể xem pháo hoa MIỄN PHÍ từ rất nhiều điểm xung quanh, dẫn đến khó bán vé show.",
      "problemKey": [
        "MIỄN PHÍ",
        "khó bán vé show"
      ],
      "approach": "Đọc kỹ toàn bộ tài liệu show diễn, nghiên cứu từng chương để đi sâu vào kịch bản. Đồng thời, nhấn mạnh vào những trải nghiệm đa giác quan chỉ có thể cảm nhận từ khán đài & tính quy mô của show diễn để thuyết phục khán giả mua vé.",
      "approachKey": [
        "kịch bản",
        "chỉ có thể cảm nhận từ khán đài"
      ],
      "posts": [
        0,
        1,
        2
      ]
    }
  ]
});
(() => {
 const section=document.querySelector('.sunworld-project');if(!section)return;
 const dialog=document.querySelector('#sw-lightbox');
 dialog.querySelector('.sw-dialog-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>document.body.classList.remove('sw-dialog-open'));
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  const title = section.querySelector('#sunworld-title');
  prepareTitle(title);
  onEntrance(section.querySelector('.sw-project-intro'),()=>{
    revealTitle(title);
    motionReveal(section.querySelector('.sw-role'), 'fade', {delay:90,duration:700});
    section.querySelectorAll('.sw-scope li').forEach((item,i)=>motionReveal(item,'fade',{delay:150+i*55,duration:600}));
    motionReveal(section.querySelector('.sw-intro-copy'), 'fade', {delay:280});
    motionReveal(section.querySelector('.sw-orbit-shape'), 'metal', {delay:100,duration:1200});
  });
  onEntrance(section.querySelector('.sw-map-column'),()=>{
    motionReveal(section.querySelector('.sw-map-card'),'fade',{duration:650});
    section.querySelectorAll('.sw-connector').forEach((path,i)=>drawStroke(path,80+i*35));
    section.querySelectorAll('.sw-location image').forEach((logo,i)=>motionReveal(logo,'fade',{delay:140+i*35,duration:650}));
  });
})();


(() => {
  const root = document.querySelector('.sunworld-project');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[data-destination]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  const pins = [...root.querySelectorAll('.sw-location')];
  const pinGroups = [[4],[2],[7,8],[5]];
  let active = 0;
  function select(index, focus = false) {
    const direction = index >= active ? 1 : -1;
    active = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    pins.forEach((pin, i) => pin.classList.toggle('is-current', pinGroups[index].includes(i)));
    if (focus) tabs[index].focus();
    motionReveal(panels[index], 'side', {direction,duration:420});
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (active + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (active - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); select(next, true);
    });
  });
})();

(() => {const root=document.querySelector('.projects-section');if(!root)return;const tabs=[...root.querySelectorAll('[data-project]')],panels=[...root.querySelectorAll('.project-panel')];let active=0;function select(i,focus=false){active=i;tabs.forEach((tab,n)=>{tab.setAttribute('aria-selected',String(n===i));tab.tabIndex=n===i?0:-1;panels[n].hidden=n!==i;});if(focus)tabs[i].focus();motionReveal(panels[i],'fade',{duration:400});}tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(i));tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(active+1)%3;if(e.key==='ArrowLeft')n=(active+2)%3;if(e.key==='Home')n=0;if(e.key==='End')n=2;if(n===undefined)return;e.preventDefault();select(n,true);});});const title=root.querySelector('#projects-title');prepareTitle(title);onEntrance(root.querySelector('.projects-heading'),()=>revealTitle(title));})();

initSunWorldCase(document.querySelector('#pq-destination-case'),{
  "prefix": "pq",
  "name": "Phú Quốc",
  "articles": [
    {
      "art": "pq.1.1",
      "caption": "pq.1.2",
      "label": "Bài 01",
      "artAlt": "Hình hướng dẫn lịch trình trải nghiệm tại Sun Paradise Land Phu Quoc",
      "captionAlt": "Nội dung bài viết hướng dẫn trải nghiệm tại Sun Paradise Land Phu Quoc",
      "url": "https://www.facebook.com/share/p/19CNK3ngb4/"
    },
    {
      "art": "pq.2.1",
      "caption": "pq.2.2",
      "label": "Bài 02",
      "artAlt": "Hình lịch trình một ngày tại Sun World Hon Thom",
      "captionAlt": "Nội dung bài viết hướng dẫn một ngày tại Sun World Hon Thom",
      "url": "https://www.facebook.com/SunWorldHonThom/posts/pfbid027tK1gWRT9h6h1UkQWQE8R2KNvpCuSSRVHapK5eMWPFYpM37dkNLnr5MaSdqq9hkpl?rdid=YoLc8sMqLW3ziubT#"
    },
    {
      "art": "pq.3.1",
      "caption": "pq.3.2",
      "label": "Bài 1",
      "artAlt": "Hình gợi ý trải nghiệm Sunset Beach Club từ ban ngày đến buổi tối",
      "captionAlt": "Nội dung bài viết giới thiệu trải nghiệm Sunset Beach Club",
      "url": "https://www.facebook.com/SunBavariaGastroPub.Official/posts/pfbid0G67C6jfaCzEJJ71TdpmGJxx5KqvufaM8qqpkygkHtN5t83zvf6voA2DtFpQWMLo9l?rdid=WIwTEQijeShWCC6I#"
    }
  ],
  "groups": [
    {
      "problem": "Khi đến với SPL Phu Quoc, du khách thường chỉ trải nghiệm nội khu, thay vì kết hợp khám phá địa phương như những nơi khác. Do đó, cần giúp khán giả lấp đầy lịch trình trải nghiệm & hướng dẫn sắp xếp hoạt động sao cho hợp lý nhất.",
      "problemKey": [
        "lấp đầy lịch trình trải nghiệm",
        "sắp xếp hoạt động"
      ],
      "approach": "Bổ sung các tuyến bài hướng dẫn trải nghiệm để không bỏ lỡ hoạt động nào.",
      "approachKey": "hướng dẫn trải nghiệm",
      "posts": [
        0,
        1
      ]
    },
    {
      "problem": "Một vài sản phẩm sẽ cần được đẩy mạnh kinh doanh thông qua (1) bán gói cho khách hàng mới, (2) thâm canh doanh thu trên mỗi pax.",
      "problemKey": [
        "bán gói cho khách hàng mới",
        "doanh thu trên mỗi pax"
      ],
      "approach": "Tăng cường giới thiệu & gợi ý trải nghiệm cho khách ghé thăm.",
      "approachKey": "giới thiệu & gợi ý trải nghiệm",
      "posts": [
        2
      ]
    }
  ]
});
(() => {
  const root=document.querySelector('#phuquoc-case');if(!root)return;
  const tabs=[...root.querySelectorAll('[data-pq-service]')];
  const panels=tabs.map(t=>document.getElementById(t.getAttribute('aria-controls')));
  let active=0;
  function select(index,focus=false){active=index;tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});if(focus)tabs[index].focus();motionReveal(panels[index],'fade',{duration:400});}
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(i));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight'||event.key==='ArrowLeft')next=1-active;if(event.key==='Home')next=0;if(event.key==='End')next=1;if(next===undefined)return;event.preventDefault();select(next,true);});});
  onEntrance(root.querySelector('.pq-case-heading'),()=>motionReveal(root.querySelector('.pq-case-heading'),'side',{direction:-1,duration:650}));
})();

initSunWorldCase(document.querySelector('#pq-eschuri-case'),{
  "prefix": "es",
  "name": "Eschuri",
  "articles": [
    {
      "art": "es.3.1",
      "caption": "es.3.2",
      "label": "Bài 1",
      "artAlt": "Hình giới thiệu đặc tính sân link-style Eschuri Vung Bau Golf",
      "captionAlt": "Nội dung bài viết về sân link-style và trải nghiệm tại Eschuri Vung Bau Golf",
      "url": "https://www.facebook.com/share/p/18FYr5HXmk/"
    },
    {
      "art": "es.1.1",
      "caption": "es.1.2",
      "label": "Bài 2",
      "artAlt": "Hình trải nghiệm chơi golf lúc hoàng hôn tại Eschuri Vung Bau Golf",
      "captionAlt": "Nội dung bài viết về trải nghiệm chơi golf lúc hoàng hôn tại Eschuri",
      "url": "https://www.facebook.com/EschuriVungBauGolf/posts/pfbid0H1HPwwHqebBNALDSRSPvWKKZxhpEPjxVdkphJLZG5nw5bnQmJmRSYc7iEdKt6ietl?rdid=oc5ksOKbjJcVKVuy#"
    },
    {
      "art": "es.2.1",
      "caption": "es.2.2",
      "label": "Bài 3",
      "artAlt": "Hình một ngày di chuyển bằng golf cart tại Eschuri Vung Bau Golf",
      "captionAlt": "Nội dung bài viết về hành trình golf cart qua sân Eschuri Vung Bau Golf",
      "url": "https://www.facebook.com/EschuriVungBauGolf/posts/pfbid0kmUe256wXauZRmh9vSWoxHmfLwaJVnrMqWT7tPY75BDx5WBJuaXuzURS8d5yMMR8l?rdid=ddYBgFZ3muVyooVk#"
    }
  ],
  "groups": [
    {
      "problem": "Với sản phẩm luxury như sân golf, cần phải lựa chọn từ ngữ, chất liệu, thông điệp truyền tải sao cho vẫn thấy được sự sang trọng, mà không mang lại cảm giác thương mại hay sáo rỗng.",
      "problemKey": [
        "từ ngữ, chất liệu, thông điệp",
        "thương mại hay sáo rỗng"
      ],
      "approach": "Hạn chế tối thiểu tính từ, gần như không dùng từ \"sang trọng\" hay bất kỳ cụm từ đồng nghĩa nào trong các bài viết. Tập trung truyền tải giá trị & trải nghiệm mà sân mang đến.",
      "approachKey": [
        "Hạn chế tối thiểu tính từ",
        "giá trị & trải nghiệm"
      ],
      "posts": [
        0,
        1,
        2
      ]
    }
  ]
});

initSunWorldCase(document.querySelector("#diff-case"),{
  "prefix": "diff",
  "name": "DIFF",
  "articles": [
    {
      "art": "diff.1.1",
      "caption": "diff.1.2",
      "label": "Bài 1",
      "url": "https://www.facebook.com/diff.vn/posts/pfbid0QJ5LFfDYeZFtuXFdHDfLJwJGnjgqzxnJQgd5Gy4ZaNs2e2ha6BocK5h8gHZhPpZyl?rdid=lDZGqpi7xIlG2Wuy#",
      "artAlt": "Hình minh họa bài 1 về Lễ hội Pháo hoa Quốc tế Đà Nẵng",
      "captionAlt": "Nội dung bài 1 trên trang truyền thông chính thức DIFF"
    },
    {
      "art": "diff.2.1",
      "caption": "diff.2.2",
      "label": "Bài 2",
      "url": "https://www.facebook.com/diff.vn/posts/pfbid0bxXHLz3ayJACM38RSLbsRTkgnmL1UVyGEpMN6NJx9JNZBC7tcHQSLXjPn1i4gzQSl?rdid=flSZTCnX0A1f8VD7#",
      "artAlt": "Hình minh họa bài 2 về Lễ hội Pháo hoa Quốc tế Đà Nẵng",
      "captionAlt": "Nội dung bài 2 trên trang truyền thông chính thức DIFF"
    },
    {
      "art": "diff.3.1",
      "caption": "diff.3.2",
      "label": "Bài 3",
      "url": "https://www.facebook.com/diff.vn/posts/pfbid02vtxU8CGd5asBkacaYKp11bCJj3qWVQHVddtH73BJcThskDphnbPHWJWyvixs1ADBl?rdid=yKT2cu5Pg50hIPzT#",
      "artAlt": "Hình minh họa bài 3 về Lễ hội Pháo hoa Quốc tế Đà Nẵng",
      "captionAlt": "Nội dung bài 3 trên trang truyền thông chính thức DIFF"
    }
  ],
  "groups": [
    {
      "problem": "Xây dựng trang truyền thông chính thức & branding cho Lễ hội, lan tỏa không khí đến công chúng & hỗ trợ bán vé DIFF & các sản phẩm khác trong hệ sinh thái",
      "problemKey": [
        "trang truyền thông chính thức",
        "hỗ trợ bán vé DIFF"
      ],
      "approach": "Khai thác đa dạng tuyến bài về lễ hội, từ đó mang đến những góc nhìn thú vị cho cộng đồng\nHighlight những giá trị nghệ thuật và tầm cỡ lễ hội, lan tỏa thương hiệu DIFF & Sun Group đến công chúng",
      "approachKey": [
        "đa dạng tuyến bài",
        "giá trị nghệ thuật và tầm cỡ lễ hội"
      ],
      "posts": [
        0,
        1,
        2
      ]
    }
  ]
});

(() => {const strip=document.querySelector('.sw-impact-strip');if(!strip)return;onEntrance(strip,()=>{strip.querySelectorAll('.sw-impact').forEach((card,i)=>motionReveal(card,i?'fade':'rise',{delay:i*100,duration:550}));});})();
