'use-strict';

const BILLBOARD = "billboard-title";
const BOBCARD = "bob-card";
const JAW = "jawBone";
// @ts-ignore
const CSS = "CSS";
const NETFLIX = "Netflix Presents: "
const MARVEL = "Marvel's ";
const UK = " (U.K.)";

const REDUCERS = [
	title => title.indexOf(MARVEL) === 0 ? title.substring(MARVEL.length) : title,
	title => title.indexOf(NETFLIX) === 0 ? title.substring(NETFLIX.length) : title,
	title => {
		let i = title.indexOf(UK);
		return i > 0 ? title.substring(0, i) : title
	}
];

let _state = {
	[BOBCARD]: null,
	[BILLBOARD]: null,
	[BILLBOARD + "1"]: null,
	[JAW]: null
};

// @ts-ignore
const radio = {
	broadcast: message => {
		try {
			// @ts-ignore
			chrome.runtime.sendMessage(message);
		} catch(e) {
			window.location.reload();
		}
	},
	// @ts-ignore
	listen: listener => chrome.runtime.onMessage.addListener(listener)
};

const to_object = map => map.reduce((obj, [key, value]) => obj[key] = value, {});
const render_css = ([property, value]) => typeof value === 'object' ? render_rule([property, value]) : `${property.replace(/_/gi, '-')}:${value};`;
// @ts-ignore
const render_rule = ([selector, properties]) => `${selector} { ${Object.entries(properties).map(render_css).join("\n")} }`;

const inject = {
	css: rules => {
		let style = document.createElement("style");
		document.head.appendChild(style);
		// @ts-ignore
		Object.entries(rules).forEach(rule => style.sheet.insertRule(render_rule(rule), style.sheet.cssRules.length));
	},
	rating: (container, rating) => {
		let div = document.createElement("div");
		let tier = Math.max(0, Math.floor(rating) - 1);
		div.className = `Rating Tier${tier}`;
		div.innerHTML = tier === 0 ? "?" : rating.toFixed(1);
		container.appendChild(div);
	}
};

const watcher = (query, listener) => {
	let stored = null;
	return e => {
		let result = query() || null;
		if (!result || result === stored)
			return;
		listener(stored = result);
	};
};

const by_class = class_name => document.getElementsByClassName(class_name);
const by_id = id => document.getElementById(id);

const reduce_title = (title, reductions) => reductions.reduce((acc,reducer) => reducer(acc), title);

// These models + the frame_listeners below can be consilidated further... TODO!
const bobcard = el => {
	let root = el.parentNode.parentNode.parentNode;
	let link = root.getElementsByTagName('a')[0];
	let title = link.getAttribute('aria-label');
	return {
		title: reduce_title(title, REDUCERS),
		link: link.getAttribute("href"),
		ui: {
			root: root,
			target: el.getElementsByClassName('bob-overlay')[0]
		}
	};
};

const billboard = el => {
	let root = el.parentNode.parentNode.parentNode;
	if (root.className === "fill-container")
		root = root.parentNode;
	let title = el.getElementsByClassName("title-logo")[0].getAttribute("title");
	return {
		title: reduce_title(title, REDUCERS),
		ui: {
			root: root,
			target: root.getElementsByClassName(root.className === "ptrack-content" ? "video-component-container" : "ActionButtons")[0]
		}
	}
};

const frame_listeners = [
	watcher(() => by_class(BOBCARD)[0], el => {
		let card = _state[BOBCARD] = bobcard(el);
		radio.broadcast({
			title: card.title,
			source: BOBCARD
		});
	}),
	watcher(() => by_class(BILLBOARD)[0], el => {
		let board = _state[BILLBOARD] = billboard(el);
		radio.broadcast({
			title: board.title,
			source: BILLBOARD
		});
	}),
	watcher(() => by_class(BILLBOARD)[1], el => {
		let board = _state[BILLBOARD + "1"] = billboard(el);
		radio.broadcast({
			title: board.title,
			source: BILLBOARD + "1"
		});
	}),
	watcher(() => by_class(JAW)[0], el => {
		let watch = watcher(() => el.getElementsByClassName('logo')[0], logo => {
			let title = logo.getAttribute("alt");
			let bone = _state[JAW] = {
				title: reduce_title(title, REDUCERS),
				ui: {
					root: el,
					target: el
				}
			};
			radio.broadcast({
				title: bone.title,
				source: JAW
			});

			frame_listeners.pop();
		});
		frame_listeners.push(watch);
	})
];

radio.listen((message, sender) => {
	if (!!sender.tab)
		return;
	if (message.source === "CSS")
		inject.css(message.rules);
	else {
		if (message.title !== _state[message.source].title)
			return;
		console.log(message.source, message.title, message.rating);
		let target = _state[message.source].ui.target;
		console.log(target);
		if (target && !target.getElementsByClassName("Rating")[0])
			inject.rating(target, message.rating);
	}
});
radio.broadcast({
	source: CSS
});

// @ts-ignore
const loop = e => frame_listeners.forEach(listener => listener(e)) || requestAnimationFrame(loop);
loop(0);
