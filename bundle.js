
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function get_binding_group_value(group, __value, checked) {
        const value = new Set();
        for (let i = 0; i < group.length; i += 1) {
            if (group[i].checked)
                value.add(group[i].__value);
        }
        if (!checked) {
            value.delete(__value);
        }
        return Array.from(value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_options(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            option.selected = ~value.indexOf(option.__value);
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function select_multiple_value(select) {
        return [].map.call(select.querySelectorAll(':checked'), option => option.__value);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function each(items, fn) {
        let str = '';
        for (let i = 0; i < items.length; i += 1) {
            str += fn(items[i], i);
        }
        return str;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.44.3 */

    const { Error: Error_1, Object: Object_1, console: console_1$1 } = globals;

    // (251:0) {:else}
    function create_else_block$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn('Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading');

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf('#/');

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: '/';

    	// Check if there's a querystring
    	const qsPosition = location.indexOf('?');

    	let querystring = '';

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener('hashchange', update, false);

    	return function stop() {
    		window.removeEventListener('hashchange', update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

    	try {
    		const newState = { ...history.state };
    		delete newState['__svelte_spa_router_scrollX'];
    		delete newState['__svelte_spa_router_scrollY'];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event('hashchange'));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
    		throw Error('Action "link" can only be used with <a> tags');
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute('href');

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == '/') {
    		// Add # to the href attribute
    		href = '#' + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
    		throw Error('Invalid value for "href" attribute: ' + href);
    	}

    	node.setAttribute('href', href);

    	node.addEventListener('click', event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == 'string') {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = '' } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
    				throw Error('Invalid component object');
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
    				throw Error('Invalid value for "path" argument - strings must start with / or *');
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == 'object' && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == 'string') {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || '/';
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || '/';
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.__svelte_spa_router_scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener('popstate', popStateChanged);

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == 'object' && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick('conditionsFailed', detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoading', Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == 'object' && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener('popstate', popStateChanged);
    	});

    	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ('props' in $$props) $$invalidate(2, props = $$props.props);
    		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
    		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
    		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
    		if ('componentObj' in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/Home.svelte generated by Svelte v3.44.3 */

    const file$4 = "src/routes/Home.svelte";

    function create_fragment$4(ctx) {
    	let h2;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Home component";
    			t1 = space();
    			p = element("p");
    			p.textContent = "This is placeholder text.";
    			add_location(h2, file$4, 0, 0, 0);
    			add_location(p, file$4, 2, 0, 25);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const behaviorCategories = ['Merit', 'Information', 'Level 1', 'Yellow Level', 'Orange Level', 'Red Level'];
    const positiveList =  ['helpful', 'On task', 'Diligent'];
    const informationList = ['sleepy', 'eating in class', 'late', 'emotional'];
    const level1List = ['off task', 'constantly chatting', 'tardy'];
    const YCList = ['shouting', 'running', 'sleeping'];
    const OCList = ['fighting', 'screaming', 'thowing objects'];
    const RCList = ['smoking', 'fireworks', 'swearing'];
    const studentData = [
        {
            "name": "Samson Jeddy Childrens",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "902",
            "id": 10,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "jchildrens@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Darin Tedman Harkness",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "166",
            "id": 38,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "tharkness@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Barrie Ulises Palatino",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "316",
            "id": 66,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "upalatino@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Rickert Lief Waistall",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "84",
            "id": 94,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "lwaistall@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Pattie Fidelio Shepcutt",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "156",
            "id": 122,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "hr_id": "G03S2",
            "email": "fshepcutt@niceschool.edu"
        },
        {
            "name": "Dorian  Tunny",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "600",
            "id": 150,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "hr_id": "G03S2",
            "email": "tunny@niceschool.edu"
        },
        {
            "name": "Toma Maritsa Whotton",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "25",
            "id": 178,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "mwhotton@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Niall Roberto Whibley",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "102",
            "id": 206,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "hr_id": "G03S2",
            "email": "rwhibley@niceschool.edu"
        },
        {
            "name": "Mickie Libbie Jobin",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "167",
            "id": 234,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "ljobin@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Minnaminnie  McDell",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "519",
            "id": 262,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "mcdell@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Amelie Ethelin Harnor",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "552",
            "id": 290,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "eharnor@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Ashla  Coney",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "774",
            "id": 318,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "coney@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Tanney Staford Haldon",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "445",
            "id": 346,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "shaldon@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Gilburt Gothart Folonin",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "200",
            "id": 374,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "hr_id": "G03S2",
            "email": "gfolonin@niceschool.edu"
        },
        {
            "name": "Clement Haslett Venable",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "46",
            "id": 402,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "hr_id": "G03S2",
            "email": "hvenable@niceschool.edu"
        },
        {
            "name": "Daniel Ram Lemmens",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "368",
            "id": 430,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "hr_id": "G03S2",
            "email": "rlemmens@niceschool.edu"
        },
        {
            "name": "Devlen Neville Forrester",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "933",
            "id": 458,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "nforrester@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Shirley Betteann Daleman",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "720",
            "id": 486,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "bdaleman@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Marget  Tenman",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "381",
            "id": 514,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "hr_id": "G03S2",
            "email": "tenman@niceschool.edu"
        },
        {
            "name": "Alon Shayne De Witt",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "33",
            "id": 542,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "sde witt@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Reidar Angeli Priel",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "610",
            "id": 570,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "apriel@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Sawyer Nikita Bilt",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "419",
            "id": 598,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "nbilt@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Cortney Bambie Palphramand",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "385",
            "id": 626,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "bpalphramand@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Den Haskel Burland",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "754",
            "id": 654,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "hr_id": "G03S2",
            "email": "hburland@niceschool.edu"
        },
        {
            "name": "Annabelle Kari McCome",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "973",
            "id": 682,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "kmccome@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Cletus Ellery Paulou",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "835",
            "id": 710,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "epaulou@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Odella Donielle Zanicchi",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "952",
            "id": 738,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "hr_id": "G03S2",
            "email": "dzanicchi@niceschool.edu"
        },
        {
            "name": "Kenna  Corrington",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "161",
            "id": 766,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "hr_id": "G03S2",
            "email": "corrington@niceschool.edu"
        },
        {
            "name": "Jemmy Pierette Osment",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "911",
            "id": 794,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "posment@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Briggs Roger Stanborough",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "980",
            "id": 822,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "hr_id": "G03S2",
            "email": "rstanborough@niceschool.edu"
        },
        {
            "name": "Sapphira Clarette Skedge",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "121",
            "id": 850,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "hr_id": "G03S2",
            "email": "cskedge@niceschool.edu"
        },
        {
            "name": "Lorrayne  Balazot",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "21",
            "id": 878,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "hr_id": "G03S2",
            "email": "edgerly@niceschool.edu"
        },
        {
            "name": "Hailey Boony Wilford",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "127",
            "id": 906,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "hr_id": "G03S2",
            "email": "bwilford@niceschool.edu"
        },
        {
            "name": "Ceil Brietta Bore",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "301",
            "id": 934,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "hr_id": "G03S2",
            "email": "bbore@niceschool.edu"
        },
        {
            "name": "Valeria Cody Ritchman",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "794",
            "id": 962,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "critchman@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Vevay Kiley Nertney",
            "level": "LS",
            "grade": "3",
            "homeroom": "Changhua",
            "student_id": "728",
            "id": 990,
            "hr_teacher_name": "Ms. Marilyn Gaynor",
            "email": "knertney@niceschool.edu",
            "hr_id": "G03S2"
        },
        {
            "name": "Rhoda  Uebel",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "802",
            "id": 11,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "uebel@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Margarita Glynda Spawell",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "265",
            "id": 39,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "gspawell@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Tiffy  Molder",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "406",
            "id": 67,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "molder@niceschool.edu"
        },
        {
            "name": "Hattie Robinette Levesley",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "942",
            "id": 95,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "rlevesley@niceschool.edu"
        },
        {
            "name": "Constantino Shem Cawte",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "727",
            "id": 123,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "scawte@niceschool.edu"
        },
        {
            "name": "Starlene Petronella Bayldon",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "382",
            "id": 151,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "pbayldon@niceschool.edu"
        },
        {
            "name": "Kary  Margrie",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "8",
            "id": 179,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "margrie@niceschool.edu"
        },
        {
            "name": "Sascha Wini Bullingham",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "682",
            "id": 207,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "wbullingham@niceschool.edu"
        },
        {
            "name": "Sybila Silvia Bahde",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "571",
            "id": 235,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "sbahde@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Stevena Lelia Lampen",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "26",
            "id": 263,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "llampen@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Nola Robin O'Shevlin",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "74",
            "id": 291,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "ro'shevlin@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Rosalynd Rosella Emett",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "231",
            "id": 319,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "remett@niceschool.edu"
        },
        {
            "name": "Mitch Rollin Schaffel",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "588",
            "id": 347,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "rschaffel@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Min Brenda Dugald",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "397",
            "id": 375,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "bdugald@niceschool.edu"
        },
        {
            "name": "Cointon  Boxell",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "813",
            "id": 403,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "boxell@niceschool.edu"
        },
        {
            "name": "Rafaello Irv Jephcott",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "650",
            "id": 431,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "ijephcott@niceschool.edu"
        },
        {
            "name": "Travis  Reedick",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "75",
            "id": 459,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "reedick@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Chen Herold MacNeillie",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "698",
            "id": 487,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "hmacneillie@niceschool.edu"
        },
        {
            "name": "Alvy  Levington",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "280",
            "id": 515,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "levington@niceschool.edu"
        },
        {
            "name": "Roberto Siegfried Trumpeter",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "559",
            "id": 543,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "strumpeter@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Janella Laura Chaddock",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "465",
            "id": 571,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "lchaddock@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Toddy Trent Aubert",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "70",
            "id": 599,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "taubert@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Cherianne Licha Proudlock",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "15",
            "id": 627,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "lproudlock@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Joscelin  Riping",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "69",
            "id": 655,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "riping@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Carey Doro Thaller",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "539",
            "id": 683,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "dthaller@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Maxi  Dufer",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "587",
            "id": 711,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "dufer@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Allegra Francesca de Vaen",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "20",
            "id": 739,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "fde vaen@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Danella Ayn Beever",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "791",
            "id": 767,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "abeever@niceschool.edu"
        },
        {
            "name": "Marylynne Claudelle Cowill",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "685",
            "id": 795,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "ccowill@niceschool.edu"
        },
        {
            "name": "Lyn  Sheers",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "472",
            "id": 823,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "sheers@niceschool.edu"
        },
        {
            "name": "Augy Darwin Farrent",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "550",
            "id": 851,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "dfarrent@niceschool.edu"
        },
        {
            "name": "Karleen Ginger Gowlett",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "299",
            "id": 879,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "ggowlett@niceschool.edu"
        },
        {
            "name": "Allys  Mavin",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "285",
            "id": 907,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "mavin@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Elenore Tabbi Swinnard",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "292",
            "id": 935,
            "hr_teacher_name": "Ms. Nathan Bright",
            "email": "tswinnard@niceschool.edu",
            "hr_id": "G04S1"
        },
        {
            "name": "Jule Gan Fowler",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "212",
            "id": 963,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "gfowler@niceschool.edu"
        },
        {
            "name": "Opal Dulcea Bradnam",
            "level": "LS",
            "grade": "4",
            "homeroom": "Chiang",
            "student_id": "377",
            "id": 991,
            "hr_teacher_name": "Ms. Nathan Bright",
            "hr_id": "G04S1",
            "email": "dbradnam@niceschool.edu"
        },
        {
            "name": "Rosalind Kassandra Petrushka",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "649",
            "id": 7,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "kpetrushka@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Berky Towny Brash",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "998",
            "id": 35,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "tbrash@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Ferdinanda Kit Conklin",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "736",
            "id": 63,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "hr_id": "G02S1",
            "email": "kconklin@niceschool.edu"
        },
        {
            "name": "Zorana Dorelle Langlais",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "41",
            "id": 91,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "dlanglais@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Skip Aldon Schuchmacher",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "203",
            "id": 119,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "hr_id": "G02S1",
            "email": "aschuchmacher@niceschool.edu"
        },
        {
            "name": "Tristam Rafaello Bruna",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "407",
            "id": 147,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "hr_id": "G02S1",
            "email": "rbruna@niceschool.edu"
        },
        {
            "name": "Berkley Darren Harsent",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "563",
            "id": 175,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "dharsent@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Ike Jon O'Spellissey",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "660",
            "id": 203,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "jo'spellissey@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Laurene Bobbe Glover",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "358",
            "id": 231,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "bglover@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Robbie Henryetta Bradley",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "527",
            "id": 259,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "hbradley@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Shayne Hope Eastbury",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "709",
            "id": 287,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "heastbury@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Tadeo Parke Wickes",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "295",
            "id": 315,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "hr_id": "G02S1",
            "email": "pwickes@niceschool.edu"
        },
        {
            "name": "Port Rabbi Alibone",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "895",
            "id": 343,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "ralibone@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Ursala Nicola Syder",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "235",
            "id": 371,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "nsyder@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Bibby Flss Purveys",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "504",
            "id": 399,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "hr_id": "G02S1",
            "email": "fpurveys@niceschool.edu"
        },
        {
            "name": "Francoise  Bricklebank",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "607",
            "id": 427,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "bricklebank@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Cyril Ring Drewett",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "331",
            "id": 455,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "hr_id": "G02S1",
            "email": "rdrewett@niceschool.edu"
        },
        {
            "name": "Huntley Stearne Grigoryev",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "809",
            "id": 483,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "hr_id": "G02S1",
            "email": "sgrigoryev@niceschool.edu"
        },
        {
            "name": "Aurore  Wilcox",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "206",
            "id": 511,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "wilcox@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Roland Jarvis Morde",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "729",
            "id": 539,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "jmorde@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Essa Cristi Caveney",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "773",
            "id": 567,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "ccaveney@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Harri  Kingaby",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "560",
            "id": 595,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "hr_id": "G02S1",
            "email": "kingaby@niceschool.edu"
        },
        {
            "name": "Mabel  Child",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "848",
            "id": 623,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "hr_id": "G02S1",
            "email": "child@niceschool.edu"
        },
        {
            "name": "Annice Chrissie Hollindale",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "489",
            "id": 651,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "hr_id": "G02S1",
            "email": "chollindale@niceschool.edu"
        },
        {
            "name": "Mary Simone Dundridge",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "688",
            "id": 679,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "hr_id": "G02S1",
            "email": "sdundridge@niceschool.edu"
        },
        {
            "name": "Glen Jen Dunthorne",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "467",
            "id": 707,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "jdunthorne@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Janeen Vivien Heathcoat",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "964",
            "id": 735,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "vheathcoat@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Allistir Merrel Cator",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "192",
            "id": 763,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "mcator@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Pedro Rollie Baude",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "611",
            "id": 791,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "rbaude@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Ade Shelden Tretwell",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "739",
            "id": 819,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "stretwell@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Wini Jerrylee Laville",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "437",
            "id": 847,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "hr_id": "G02S1",
            "email": "jlaville@niceschool.edu"
        },
        {
            "name": "Bonnibelle Hyacinthe Pfeifer",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "405",
            "id": 875,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "hr_id": "G02S1",
            "email": "hpfeifer@niceschool.edu"
        },
        {
            "name": "Deeyn Margaret Brugman",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "474",
            "id": 903,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "mbrugman@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Jereme  Folkard",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "456",
            "id": 931,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "hr_id": "G02S1",
            "email": "folkard@niceschool.edu"
        },
        {
            "name": "Mill  Wethered",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "255",
            "id": 959,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "wethered@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Isabelita Marney Celand",
            "level": "LS",
            "grade": "2",
            "homeroom": "Chiayi",
            "student_id": "496",
            "id": 987,
            "hr_teacher_name": "Ms. Marilyn Cattell",
            "email": "mceland@niceschool.edu",
            "hr_id": "G02S1"
        },
        {
            "name": "Blanch Arlene Manns",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "738",
            "id": 12,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "amanns@niceschool.edu"
        },
        {
            "name": "Winthrop  Dagless",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "807",
            "id": 40,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "dagless@niceschool.edu"
        },
        {
            "name": "Nickolai Scot Iashvili",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "915",
            "id": 68,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "siashvili@niceschool.edu"
        },
        {
            "name": "Imogene Gennie Rattry",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "309",
            "id": 96,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "grattry@niceschool.edu"
        },
        {
            "name": "Luigi Luciano Roddan",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "451",
            "id": 124,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "lroddan@niceschool.edu"
        },
        {
            "name": "Waylan Hobart Bangs",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "388",
            "id": 152,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "hbangs@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Lolly Noreen Hitter",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "233",
            "id": 180,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "nhitter@niceschool.edu"
        },
        {
            "name": "Alberik Freeland McManamon",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "95",
            "id": 208,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "fmcmanamon@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Brenn Dolores Gingedale",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "530",
            "id": 236,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "dgingedale@niceschool.edu"
        },
        {
            "name": "Trefor  Boxill",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "83",
            "id": 264,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "boxill@niceschool.edu"
        },
        {
            "name": "Cornie Roseanne Gault",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "586",
            "id": 292,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "rgault@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Darin Nowell Overlow",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "421",
            "id": 320,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "noverlow@niceschool.edu"
        },
        {
            "name": "Tailor  Le Ball",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "873",
            "id": 348,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "le ball@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Aldridge  Esche",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "488",
            "id": 376,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "esche@niceschool.edu"
        },
        {
            "name": "Jacintha  Weedenburg",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "67",
            "id": 404,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "weedenburg@niceschool.edu"
        },
        {
            "name": "Baron Tobit Alty",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "668",
            "id": 432,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "talty@niceschool.edu"
        },
        {
            "name": "Mile Andros Hindenburg",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "448",
            "id": 460,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "ahindenburg@niceschool.edu"
        },
        {
            "name": "Crichton Rurik McQuarter",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "956",
            "id": 488,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "rmcquarter@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Riccardo Colet Proppers",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "798",
            "id": 516,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "cproppers@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Phil Tremayne Ucceli",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "570",
            "id": 544,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "tucceli@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Issi Karyl Derges",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "130",
            "id": 572,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "kderges@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Haley  Airy",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "861",
            "id": 600,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "airy@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Nettie  Rosita",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "868",
            "id": 628,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "rosita@niceschool.edu"
        },
        {
            "name": "Bronson  Chatband",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "827",
            "id": 656,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "chatband@niceschool.edu"
        },
        {
            "name": "Erika Muire Morison",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "751",
            "id": 684,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "mmorison@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Edith Camila Pinson",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "603",
            "id": 712,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "cpinson@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Benedikt Milo Willcot",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "760",
            "id": 740,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "mwillcot@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Byram  Wyness",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "63",
            "id": 768,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "wyness@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Sidonnie Cecilia Cammacke",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "435",
            "id": 796,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "ccammacke@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Rollie Trace Tribe",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "681",
            "id": 824,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "ttribe@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Parry  Pattullo",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "392",
            "id": 852,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "pattullo@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Anne  Coulter",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "958",
            "id": 880,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "coulter@niceschool.edu"
        },
        {
            "name": "Cinnamon Alia Crocetti",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "353",
            "id": 908,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "acrocetti@niceschool.edu"
        },
        {
            "name": "Kiersten Marjy Dene",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "986",
            "id": 936,
            "hr_teacher_name": "Ms. Marie Farmer",
            "email": "mdene@niceschool.edu",
            "hr_id": "G04S2"
        },
        {
            "name": "Cherye Elspeth Verrills",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "996",
            "id": 964,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "everrills@niceschool.edu"
        },
        {
            "name": "Gal Syman Everly",
            "level": "LS",
            "grade": "4",
            "homeroom": "Douliu",
            "student_id": "97",
            "id": 992,
            "hr_teacher_name": "Ms. Marie Farmer",
            "hr_id": "G04S2",
            "email": "severly@niceschool.edu"
        },
        {
            "name": "Dita  Pulham",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "857",
            "id": 8,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "pulham@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Sunny Alisha Perigeaux",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "684",
            "id": 36,
            "hr_teacher_name": "Mr. Chris Forth",
            "hr_id": "G02S2",
            "email": "aperigeaux@niceschool.edu"
        },
        {
            "name": "Spence Gustavus Lingner",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "238",
            "id": 64,
            "hr_teacher_name": "Mr. Chris Forth",
            "hr_id": "G02S2",
            "email": "glingner@niceschool.edu"
        },
        {
            "name": "Amery Lukas Priscott",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "573",
            "id": 92,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "lpriscott@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Kippie Edik Neville",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "197",
            "id": 120,
            "hr_teacher_name": "Mr. Chris Forth",
            "hr_id": "G02S2",
            "email": "eneville@niceschool.edu"
        },
        {
            "name": "Christoph  Gornar",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "924",
            "id": 148,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "gornar@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Calli Mindy Bennet",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "221",
            "id": 176,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "mbennet@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Dulcy Lynnet Fulker",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "176",
            "id": 204,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "lfulker@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Alisha Kathlin Sturm",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "766",
            "id": 232,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "ksturm@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Kimberlee Ellynn Allberry",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "680",
            "id": 260,
            "hr_teacher_name": "Mr. Chris Forth",
            "hr_id": "G02S2",
            "email": "eallberry@niceschool.edu"
        },
        {
            "name": "Andros Ode Walling",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "355",
            "id": 288,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "owalling@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Em Ardath Muldoon",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "812",
            "id": 316,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "amuldoon@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Robin Quill Ohm",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "839",
            "id": 344,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "qohm@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Hew Lauritz Hinken",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "558",
            "id": 372,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "lhinken@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Vonni  Tapping",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "639",
            "id": 400,
            "hr_teacher_name": "Mr. Chris Forth",
            "hr_id": "G02S2",
            "email": "tapping@niceschool.edu"
        },
        {
            "name": "Adelaide Alexandrina Bramble",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "828",
            "id": 428,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "abramble@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Olvan  Murison",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "882",
            "id": 456,
            "hr_teacher_name": "Mr. Chris Forth",
            "hr_id": "G02S2",
            "email": "murison@niceschool.edu"
        },
        {
            "name": "Duky Humbert Gallemore",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "340",
            "id": 484,
            "hr_teacher_name": "Mr. Chris Forth",
            "hr_id": "G02S2",
            "email": "hgallemore@niceschool.edu"
        },
        {
            "name": "Freida Rianon Imlin",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "183",
            "id": 512,
            "hr_teacher_name": "Mr. Chris Forth",
            "hr_id": "G02S2",
            "email": "rimlin@niceschool.edu"
        },
        {
            "name": "Dale Herbie Duerden",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "656",
            "id": 540,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "hduerden@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Kennith Lowrance Lochead",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "88",
            "id": 568,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "llochead@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Tressa Koren Trail",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "429",
            "id": 596,
            "hr_teacher_name": "Mr. Chris Forth",
            "hr_id": "G02S2",
            "email": "ktrail@niceschool.edu"
        },
        {
            "name": "Oneida Emeline Capelen",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "769",
            "id": 624,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "ecapelen@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Tandie Cordelia Stiling",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "57",
            "id": 652,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "cstiling@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Alasdair Field Mansfield",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "270",
            "id": 680,
            "hr_teacher_name": "Mr. Chris Forth",
            "hr_id": "G02S2",
            "email": "fmansfield@niceschool.edu"
        },
        {
            "name": "Jill  Alan",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "529",
            "id": 708,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "alan@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Randolf Levey Shapiro",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "484",
            "id": 736,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "lshapiro@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Charil Willabella Hodgets",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "935",
            "id": 764,
            "hr_teacher_name": "Mr. Chris Forth",
            "hr_id": "G02S2",
            "email": "whodgets@niceschool.edu"
        },
        {
            "name": "Lurette Evey Garnar",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "422",
            "id": 792,
            "hr_teacher_name": "Mr. Chris Forth",
            "hr_id": "G02S2",
            "email": "egarnar@niceschool.edu"
        },
        {
            "name": "Lynde  Dootson",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "994",
            "id": 820,
            "hr_teacher_name": "Mr. Chris Forth",
            "hr_id": "G02S2",
            "email": "dootson@niceschool.edu"
        },
        {
            "name": "Pepillo  Twede",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "110",
            "id": 848,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "twede@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Davon Kaspar Smiths",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "920",
            "id": 876,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "ksmiths@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Lorie Demetra Brownsall",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "263",
            "id": 904,
            "hr_teacher_name": "Mr. Chris Forth",
            "hr_id": "G02S2",
            "email": "dbrownsall@niceschool.edu"
        },
        {
            "name": "Alain Salmon Gadson",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "888",
            "id": 932,
            "hr_teacher_name": "Mr. Chris Forth",
            "hr_id": "G02S2",
            "email": "sgadson@niceschool.edu"
        },
        {
            "name": "Florie Meridel Gibling",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "37",
            "id": 960,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "mgibling@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Aguste  Wessell",
            "level": "LS",
            "grade": "2",
            "homeroom": "Hsinchu",
            "student_id": "654",
            "id": 988,
            "hr_teacher_name": "Mr. Chris Forth",
            "email": "wessell@niceschool.edu",
            "hr_id": "G02S2"
        },
        {
            "name": "Luis Hamish Micah",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "506",
            "id": 13,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "hmicah@niceschool.edu"
        },
        {
            "name": "Chester Niko Vivien",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "80",
            "id": 41,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "email": "nvivien@niceschool.edu",
            "hr_id": "G05S1"
        },
        {
            "name": "Flor Cassy Fass",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "742",
            "id": 69,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "cfass@niceschool.edu"
        },
        {
            "name": "Leo Dino Gircke",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "274",
            "id": 97,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "dgircke@niceschool.edu"
        },
        {
            "name": "Andres Abe Macci",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "48",
            "id": 125,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "email": "amacci@niceschool.edu",
            "hr_id": "G05S1"
        },
        {
            "name": "Terence Perren Dyhouse",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "256",
            "id": 153,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "pdyhouse@niceschool.edu"
        },
        {
            "name": "Vanny Beilul Keeley",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "293",
            "id": 181,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "email": "bkeeley@niceschool.edu",
            "hr_id": "G05S1"
        },
        {
            "name": "Juan  Greer",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "248",
            "id": 209,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "email": "greer@niceschool.edu",
            "hr_id": "G05S1"
        },
        {
            "name": "Ody Noel Patershall",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "143",
            "id": 237,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "npatershall@niceschool.edu"
        },
        {
            "name": "Ruthann Maren Hulmes",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "591",
            "id": 265,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "email": "mhulmes@niceschool.edu",
            "hr_id": "G05S1"
        },
        {
            "name": "Thorny Isaak Beldam",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "152",
            "id": 293,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "email": "ibeldam@niceschool.edu",
            "hr_id": "G05S1"
        },
        {
            "name": "Doralin  Alessandrucci",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "372",
            "id": 321,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "alessandrucci@niceschool.edu"
        },
        {
            "name": "Mahmud  Grogan",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "82",
            "id": 349,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "email": "grogan@niceschool.edu",
            "hr_id": "G05S1"
        },
        {
            "name": "Egon Ronald McKellar",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "884",
            "id": 377,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "rmckellar@niceschool.edu"
        },
        {
            "name": "Lucio Pippo Walduck",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "508",
            "id": 405,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "pwalduck@niceschool.edu"
        },
        {
            "name": "Flint Iago Graundisson",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "598",
            "id": 433,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "email": "igraundisson@niceschool.edu",
            "hr_id": "G05S1"
        },
        {
            "name": "Berthe Natty Heeps",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "440",
            "id": 461,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "email": "nheeps@niceschool.edu",
            "hr_id": "G05S1"
        },
        {
            "name": "Hillyer Tobias O' Flaherty",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "131",
            "id": 489,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "to' flaherty@niceschool.edu"
        },
        {
            "name": "Ceil Naomi Labon",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "454",
            "id": 517,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "email": "nlabon@niceschool.edu",
            "hr_id": "G05S1"
        },
        {
            "name": "Phillipp Donnell Skains",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "532",
            "id": 545,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "dskains@niceschool.edu"
        },
        {
            "name": "Elwood Ad MacNish",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "312",
            "id": 573,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "amacnish@niceschool.edu"
        },
        {
            "name": "Hilton Marius Weller",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "627",
            "id": 601,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "mweller@niceschool.edu"
        },
        {
            "name": "Thomasin Lisa Louca",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "544",
            "id": 629,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "email": "llouca@niceschool.edu",
            "hr_id": "G05S1"
        },
        {
            "name": "Camala  Planks",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "799",
            "id": 657,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "email": "planks@niceschool.edu",
            "hr_id": "G05S1"
        },
        {
            "name": "Leeland Beniamino Challace",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "887",
            "id": 685,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "bchallace@niceschool.edu"
        },
        {
            "name": "Anson  Vasilischev",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "367",
            "id": 713,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "email": "vasilischev@niceschool.edu",
            "hr_id": "G05S1"
        },
        {
            "name": "Tades  Haddy",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "737",
            "id": 741,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "haddy@niceschool.edu"
        },
        {
            "name": "Lanna Ginevra Meaking",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "615",
            "id": 769,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "email": "gmeaking@niceschool.edu",
            "hr_id": "G05S1"
        },
        {
            "name": "Hildegarde  Flahy",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "953",
            "id": 797,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "flahy@niceschool.edu"
        },
        {
            "name": "Bale Darb Worral",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "577",
            "id": 825,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "dworral@niceschool.edu"
        },
        {
            "name": "Axel Reinaldo Bru",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "502",
            "id": 853,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "rbru@niceschool.edu"
        },
        {
            "name": "Garrik Theodor Laurent",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "906",
            "id": 881,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "tlaurent@niceschool.edu"
        },
        {
            "name": "Ardelis  Sallier",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "569",
            "id": 909,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "sallier@niceschool.edu"
        },
        {
            "name": "Waneta Cally Roxby",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "631",
            "id": 937,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "email": "croxby@niceschool.edu",
            "hr_id": "G05S1"
        },
        {
            "name": "Gilbert  Grosvener",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "501",
            "id": 965,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "grosvener@niceschool.edu"
        },
        {
            "name": "Duke Vito Treleven",
            "level": "LS",
            "grade": "5",
            "homeroom": "Hualien",
            "student_id": "269",
            "id": 993,
            "hr_teacher_name": "Mr. Angelica Lunt",
            "hr_id": "G05S1",
            "email": "vtreleven@niceschool.edu"
        },
        {
            "name": "Rafaellle Thaddeus Coughlan",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "387",
            "id": 1,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "tcoughlan@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Quentin  Adamolli",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "669",
            "id": 29,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "adamolli@niceschool.edu"
        },
        {
            "name": "Lynnell Harley O'Cassidy",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "518",
            "id": 57,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "ho'cassidy@niceschool.edu"
        },
        {
            "name": "Gran  Gioani",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "845",
            "id": 85,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "gioani@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Carmelia Adelind Ygo",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "294",
            "id": 113,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "aygo@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Esta Ami Kitt",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "386",
            "id": 141,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "akitt@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Germaine  Heinsen",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "735",
            "id": 169,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "heinsen@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Clayborne Yardley Bottlestone",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "112",
            "id": 197,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "ybottlestone@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Nester Cheston Jardin",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "636",
            "id": 225,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "cjardin@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Mayor  Tesimon",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "746",
            "id": 253,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "tesimon@niceschool.edu"
        },
        {
            "name": "Marius Hamid Vargas",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "220",
            "id": 281,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "hvargas@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Lindi Tedi Showalter",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "565",
            "id": 309,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "tshowalter@niceschool.edu"
        },
        {
            "name": "Bevan  Bartolomeo",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "830",
            "id": 337,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "bartolomeo@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Raff Barnett Kurten",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "938",
            "id": 365,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "bkurten@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Broderic Rossy Disbury",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "482",
            "id": 393,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "rdisbury@niceschool.edu"
        },
        {
            "name": "Vachel Towny Drowsfield",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "13",
            "id": 421,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "tdrowsfield@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Robina Shir Pike",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "605",
            "id": 449,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "spike@niceschool.edu"
        },
        {
            "name": "Wilona  Jerzykiewicz",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "934",
            "id": 477,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "jerzykiewicz@niceschool.edu"
        },
        {
            "name": "Jarrid Guilbert Burlingham",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "516",
            "id": 505,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "gburlingham@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Charisse  Brouwer",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "208",
            "id": 533,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "brouwer@niceschool.edu"
        },
        {
            "name": "Eugen Normand McAllester",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "779",
            "id": 561,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "nmcallester@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Danni  Burton",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "142",
            "id": 589,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "burton@niceschool.edu"
        },
        {
            "name": "Valli  Bottoms",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "79",
            "id": 617,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "bottoms@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Rhoda Melisa Good",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "900",
            "id": 645,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "mgood@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Keir  Crossgrove",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "136",
            "id": 673,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "crossgrove@niceschool.edu"
        },
        {
            "name": "Daffy  Runnett",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "36",
            "id": 701,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "runnett@niceschool.edu"
        },
        {
            "name": "Lacey  Pestor",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "690",
            "id": 729,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "pestor@niceschool.edu"
        },
        {
            "name": "Arch Thebault Bortolussi",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "838",
            "id": 757,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "tbortolussi@niceschool.edu"
        },
        {
            "name": "Tye  Wixey",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "66",
            "id": 785,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "wixey@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Kimble  Ogelsby",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "128",
            "id": 813,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "ogelsby@niceschool.edu"
        },
        {
            "name": "Pet  Rosendale",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "993",
            "id": 841,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "rosendale@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Val  Bywaters",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "100",
            "id": 869,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "bywaters@niceschool.edu"
        },
        {
            "name": "Tann Mill Eacott",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "471",
            "id": 897,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "meacott@niceschool.edu"
        },
        {
            "name": "Rube Kerk Seeman",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "655",
            "id": 925,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "email": "kseeman@niceschool.edu",
            "hr_id": "GPKS1"
        },
        {
            "name": "Alejandro Blair Cuxson",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "356",
            "id": 953,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "bcuxson@niceschool.edu"
        },
        {
            "name": "Correna Livia Layton",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Kaohsiung",
            "student_id": "342",
            "id": 981,
            "hr_teacher_name": "Ms. Victoria Bishop",
            "hr_id": "GPKS1",
            "email": "llayton@niceschool.edu"
        },
        {
            "name": "Alfy Werner Twiddle",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "833",
            "id": 9,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "wtwiddle@niceschool.edu"
        },
        {
            "name": "Lynn Neall Cardozo",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "394",
            "id": 37,
            "hr_teacher_name": "Mr. Chris Samuel",
            "email": "ncardozo@niceschool.edu",
            "hr_id": "G03S1"
        },
        {
            "name": "Constancia  Camamile",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "788",
            "id": 65,
            "hr_teacher_name": "Mr. Chris Samuel",
            "email": "camamile@niceschool.edu",
            "hr_id": "G03S1"
        },
        {
            "name": "Nerte Sidonia Yarr",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "132",
            "id": 93,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "syarr@niceschool.edu"
        },
        {
            "name": "Claudie  Zoppie",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "785",
            "id": 121,
            "hr_teacher_name": "Mr. Chris Samuel",
            "email": "zoppie@niceschool.edu",
            "hr_id": "G03S1"
        },
        {
            "name": "Cory  McIlenna",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "76",
            "id": 149,
            "hr_teacher_name": "Mr. Chris Samuel",
            "email": "mcilenna@niceschool.edu",
            "hr_id": "G03S1"
        },
        {
            "name": "Franzen Marwin Itzkovitch",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "173",
            "id": 177,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "mitzkovitch@niceschool.edu"
        },
        {
            "name": "Brana  Helversen",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "927",
            "id": 205,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "helversen@niceschool.edu"
        },
        {
            "name": "Devora Hyacinthia Lambeth",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "687",
            "id": 233,
            "hr_teacher_name": "Mr. Chris Samuel",
            "email": "hlambeth@niceschool.edu",
            "hr_id": "G03S1"
        },
        {
            "name": "Lorne Betta Crolly",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "940",
            "id": 261,
            "hr_teacher_name": "Mr. Chris Samuel",
            "email": "bcrolly@niceschool.edu",
            "hr_id": "G03S1"
        },
        {
            "name": "Cassey Mandi Cushe",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "743",
            "id": 289,
            "hr_teacher_name": "Mr. Chris Samuel",
            "email": "mcushe@niceschool.edu",
            "hr_id": "G03S1"
        },
        {
            "name": "Brandyn Welch Trenouth",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "464",
            "id": 317,
            "hr_teacher_name": "Mr. Chris Samuel",
            "email": "wtrenouth@niceschool.edu",
            "hr_id": "G03S1"
        },
        {
            "name": "Hammad Alano Fernez",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "819",
            "id": 345,
            "hr_teacher_name": "Mr. Chris Samuel",
            "email": "afernez@niceschool.edu",
            "hr_id": "G03S1"
        },
        {
            "name": "Karim Burtie Pasley",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "556",
            "id": 373,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "bpasley@niceschool.edu"
        },
        {
            "name": "Tom  Setterington",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "322",
            "id": 401,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "setterington@niceschool.edu"
        },
        {
            "name": "Selma Kelcey Gurge",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "40",
            "id": 429,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "kgurge@niceschool.edu"
        },
        {
            "name": "Marni Crin Stollenhof",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "756",
            "id": 457,
            "hr_teacher_name": "Mr. Chris Samuel",
            "email": "cstollenhof@niceschool.edu",
            "hr_id": "G03S1"
        },
        {
            "name": "Gaspar  Ohrtmann",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "851",
            "id": 485,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "ohrtmann@niceschool.edu"
        },
        {
            "name": "Jori Hanny Breewood",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "101",
            "id": 513,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "hbreewood@niceschool.edu"
        },
        {
            "name": "Isaiah Jose Arguile",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "27",
            "id": 541,
            "hr_teacher_name": "Mr. Chris Samuel",
            "email": "jarguile@niceschool.edu",
            "hr_id": "G03S1"
        },
        {
            "name": "Ibrahim Erasmus Coltart",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "928",
            "id": 569,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "ecoltart@niceschool.edu"
        },
        {
            "name": "Delphine  Bonnar",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "186",
            "id": 597,
            "hr_teacher_name": "Mr. Chris Samuel",
            "email": "bonnar@niceschool.edu",
            "hr_id": "G03S1"
        },
        {
            "name": "Phillip  Flanagan",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "93",
            "id": 625,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "flanagan@niceschool.edu"
        },
        {
            "name": "Ninetta Yolande Hodinton",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "162",
            "id": 653,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "yhodinton@niceschool.edu"
        },
        {
            "name": "Ariela  Sloy",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "704",
            "id": 681,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "sloy@niceschool.edu"
        },
        {
            "name": "Sigrid  McEachern",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "834",
            "id": 709,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "mceachern@niceschool.edu"
        },
        {
            "name": "Flo Anabelle Spaxman",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "58",
            "id": 737,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "aspaxman@niceschool.edu"
        },
        {
            "name": "Demetria Lari Duddle",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "626",
            "id": 765,
            "hr_teacher_name": "Mr. Chris Samuel",
            "email": "lduddle@niceschool.edu",
            "hr_id": "G03S1"
        },
        {
            "name": "Corilla Cindelyn Fylan",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "357",
            "id": 793,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "cfylan@niceschool.edu"
        },
        {
            "name": "Ramsay Man Paiton",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "753",
            "id": 821,
            "hr_teacher_name": "Mr. Chris Samuel",
            "email": "mpaiton@niceschool.edu",
            "hr_id": "G03S1"
        },
        {
            "name": "Sallyann Corissa Haney",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "211",
            "id": 849,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "chaney@niceschool.edu"
        },
        {
            "name": "Benita  Grece",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "122",
            "id": 877,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "grece@niceschool.edu"
        },
        {
            "name": "Doloritas Nananne Houlison",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "141",
            "id": 905,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "nhoulison@niceschool.edu"
        },
        {
            "name": "Ive Jasen Roggero",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "71",
            "id": 933,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "jroggero@niceschool.edu"
        },
        {
            "name": "Genevra Jacqueline Joanaud",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "613",
            "id": 961,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "jjoanaud@niceschool.edu"
        },
        {
            "name": "Niles Gerhardt Atter",
            "level": "LS",
            "grade": "3",
            "homeroom": "Keelung",
            "student_id": "91",
            "id": 989,
            "hr_teacher_name": "Mr. Chris Samuel",
            "hr_id": "G03S1",
            "email": "gatter@niceschool.edu"
        },
        {
            "name": "Tailor Maximo Greg",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "525",
            "id": 15,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "mgreg@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Georgie Nananne McBrearty",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "988",
            "id": 43,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "nmcbrearty@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Gradey  Rayner",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "523",
            "id": 71,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "rayner@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Shawnee Charmion Lestrange",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "554",
            "id": 99,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "hr_id": "G06S1",
            "email": "clestrange@niceschool.edu"
        },
        {
            "name": "Hersh Virge Billam",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "5",
            "id": 127,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "vbillam@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Jamesy Stuart Garrioch",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "770",
            "id": 155,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "hr_id": "G06S1",
            "email": "sgarrioch@niceschool.edu"
        },
        {
            "name": "Raleigh Garwin Elkin",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "599",
            "id": 183,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "hr_id": "G06S1",
            "email": "gelkin@niceschool.edu"
        },
        {
            "name": "Erinn  Inkle",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "505",
            "id": 211,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "inkle@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Chandra Aurelea Woodham",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "991",
            "id": 239,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "awoodham@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Charleen  Randell",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "398",
            "id": 267,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "randell@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Rockey  Tatersale",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "659",
            "id": 295,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "hr_id": "G06S1",
            "email": "tatersale@niceschool.edu"
        },
        {
            "name": "Wendy Chelsae Eastment",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "50",
            "id": 323,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "ceastment@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Clayborne  Slemmonds",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "893",
            "id": 351,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "hr_id": "G06S1",
            "email": "slemmonds@niceschool.edu"
        },
        {
            "name": "Westleigh Patin Hansford",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "638",
            "id": 379,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "phansford@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Shayne  Dowles",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "651",
            "id": 407,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "dowles@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Langsdon Ganny Faldo",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "133",
            "id": 435,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "hr_id": "G06S1",
            "email": "gfaldo@niceschool.edu"
        },
        {
            "name": "Isaac  Rengger",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "695",
            "id": 463,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "rengger@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Raye Dulcea Brampton",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "619",
            "id": 491,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "dbrampton@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Kipp Nonna Scoyne",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "43",
            "id": 519,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "hr_id": "G06S1",
            "email": "nscoyne@niceschool.edu"
        },
        {
            "name": "Vassily  Trouncer",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "957",
            "id": 547,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "hr_id": "G06S1",
            "email": "trouncer@niceschool.edu"
        },
        {
            "name": "Lorita Haley Skarin",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "877",
            "id": 575,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "hskarin@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Warren Graig Eyers",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "485",
            "id": 603,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "hr_id": "G06S1",
            "email": "geyers@niceschool.edu"
        },
        {
            "name": "Alena  Gianetti",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "507",
            "id": 631,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "gianetti@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Rebeka  Bounde",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "818",
            "id": 659,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "bounde@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Sherlock Ebenezer Sides",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "272",
            "id": 687,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "esides@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Tisha Gwendolyn Nerger",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "758",
            "id": 715,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "gnerger@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Yuri Chic Cavy",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "676",
            "id": 743,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "hr_id": "G06S1",
            "email": "ccavy@niceschool.edu"
        },
        {
            "name": "Kinna Tracy Cleaveland",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "444",
            "id": 771,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "tcleaveland@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Ardella Idette Featherstone",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "749",
            "id": 799,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "hr_id": "G06S1",
            "email": "ifeatherstone@niceschool.edu"
        },
        {
            "name": "Alethea  Sugge",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "217",
            "id": 827,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "sugge@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Edsel Lion Folds",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "62",
            "id": 855,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "hr_id": "G06S1",
            "email": "lfolds@niceschool.edu"
        },
        {
            "name": "Rennie Caritta Ohanessian",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "413",
            "id": 883,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "hr_id": "G06S1",
            "email": "cohanessian@niceschool.edu"
        },
        {
            "name": "Jud Dunc O' Molan",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "856",
            "id": 911,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "hr_id": "G06S1",
            "email": "do' molan@niceschool.edu"
        },
        {
            "name": "Babette  O'Rafferty",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "978",
            "id": 939,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "hr_id": "G06S1",
            "email": "orafferty@niceschool.edu"
        },
        {
            "name": "Worthington  Bowlas",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "954",
            "id": 967,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "hr_id": "G06S1",
            "email": "bowlas@niceschool.edu"
        },
        {
            "name": "Fin Damon Muldrew",
            "level": "MS",
            "grade": "6",
            "homeroom": "Magong",
            "student_id": "647",
            "id": 995,
            "hr_teacher_name": "Mr. Aiden Weatcroft",
            "email": "dmuldrew@niceschool.edu",
            "hr_id": "G06S1"
        },
        {
            "name": "Teodor Leeland Shemmin",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "384",
            "id": 16,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "email": "lshemmin@niceschool.edu",
            "hr_id": "G06S2"
        },
        {
            "name": "Roxi Birgit Orrum",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "42",
            "id": 44,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "email": "borrum@niceschool.edu",
            "hr_id": "G06S2"
        },
        {
            "name": "Vaclav Arel Brompton",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "198",
            "id": 72,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "email": "abrompton@niceschool.edu",
            "hr_id": "G06S2"
        },
        {
            "name": "Tedman Preston Waud",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "965",
            "id": 100,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "pwaud@niceschool.edu"
        },
        {
            "name": "Dalt  Dugmore",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "976",
            "id": 128,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "dugmore@niceschool.edu"
        },
        {
            "name": "Meir Bennett Bowling",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "764",
            "id": 156,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "email": "bbowling@niceschool.edu",
            "hr_id": "G06S2"
        },
        {
            "name": "Shel Lanie Digwood",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "677",
            "id": 184,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "ldigwood@niceschool.edu"
        },
        {
            "name": "Joyan Kathi Terne",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "123",
            "id": 212,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "email": "kterne@niceschool.edu",
            "hr_id": "G06S2"
        },
        {
            "name": "Sandy William Antonik",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "108",
            "id": 240,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "wantonik@niceschool.edu"
        },
        {
            "name": "Cyrill  Lias",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "629",
            "id": 268,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "lias@niceschool.edu"
        },
        {
            "name": "Wilhelmina Jesselyn Deverille",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "22",
            "id": 296,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "email": "jdeverille@niceschool.edu",
            "hr_id": "G06S2"
        },
        {
            "name": "Eunice  Negri",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "222",
            "id": 324,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "negri@niceschool.edu"
        },
        {
            "name": "Robinett Adelind Pecht",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "950",
            "id": 352,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "apecht@niceschool.edu"
        },
        {
            "name": "Merola Chelsae Cary",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "187",
            "id": 380,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "ccary@niceschool.edu"
        },
        {
            "name": "Rodina Freddi Patmore",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "667",
            "id": 408,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "fpatmore@niceschool.edu"
        },
        {
            "name": "Lanae  Scriver",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "658",
            "id": 436,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "scriver@niceschool.edu"
        },
        {
            "name": "Maridel  Fettiplace",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "44",
            "id": 464,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "fettiplace@niceschool.edu"
        },
        {
            "name": "Danielle Audy Witton",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "56",
            "id": 492,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "awitton@niceschool.edu"
        },
        {
            "name": "Keelia Seka Kellert",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "24",
            "id": 520,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "email": "skellert@niceschool.edu",
            "hr_id": "G06S2"
        },
        {
            "name": "Phaidra  Carrabot",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "966",
            "id": 548,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "email": "carrabot@niceschool.edu",
            "hr_id": "G06S2"
        },
        {
            "name": "Giulio  Pladen",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "536",
            "id": 576,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "pladen@niceschool.edu"
        },
        {
            "name": "Aundrea  Birtwisle",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "583",
            "id": 604,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "email": "birtwisle@niceschool.edu",
            "hr_id": "G06S2"
        },
        {
            "name": "Andra Rozanne Greaterex",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "733",
            "id": 632,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "rgreaterex@niceschool.edu"
        },
        {
            "name": "Adella Trina Grassick",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "87",
            "id": 660,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "tgrassick@niceschool.edu"
        },
        {
            "name": "Gwendolen Ulrica Davidowich",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "446",
            "id": 688,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "email": "udavidowich@niceschool.edu",
            "hr_id": "G06S2"
        },
        {
            "name": "Jeane Lesli Laverenz",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "771",
            "id": 716,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "llaverenz@niceschool.edu"
        },
        {
            "name": "Morris  Drayson",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "68",
            "id": 744,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "drayson@niceschool.edu"
        },
        {
            "name": "Junina Daloris Nealey",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "99",
            "id": 772,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "email": "dnealey@niceschool.edu",
            "hr_id": "G06S2"
        },
        {
            "name": "Gennifer Othella Chipping",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "898",
            "id": 800,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "email": "ochipping@niceschool.edu",
            "hr_id": "G06S2"
        },
        {
            "name": "Genvieve  Harlin",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "275",
            "id": 828,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "email": "harlin@niceschool.edu",
            "hr_id": "G06S2"
        },
        {
            "name": "Rivkah Charisse Danilyak",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "614",
            "id": 856,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "cdanilyak@niceschool.edu"
        },
        {
            "name": "Katrine  Girod",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "945",
            "id": 884,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "girod@niceschool.edu"
        },
        {
            "name": "Putnem Finn Hillett",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "901",
            "id": 912,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "hr_id": "G06S2",
            "email": "fhillett@niceschool.edu"
        },
        {
            "name": "Vivia  Maltman",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "85",
            "id": 940,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "email": "maltman@niceschool.edu",
            "hr_id": "G06S2"
        },
        {
            "name": "Muriel Jennine Clement",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "172",
            "id": 968,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "email": "jclement@niceschool.edu",
            "hr_id": "G06S2"
        },
        {
            "name": "Ryun Raddy McMurthy",
            "level": "MS",
            "grade": "6",
            "homeroom": "Miaoli",
            "student_id": "657",
            "id": 996,
            "hr_teacher_name": "Ms. Abdul Rossi",
            "email": "rmcmurthy@niceschool.edu",
            "hr_id": "G06S2"
        },
        {
            "name": "Nicky Arvy Linguard",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "574",
            "id": 18,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "hr_id": "G07S2",
            "email": "alinguard@niceschool.edu"
        },
        {
            "name": "Genia Danya Argrave",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "719",
            "id": 46,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "hr_id": "G07S2",
            "email": "dargrave@niceschool.edu"
        },
        {
            "name": "Nevin Neal Earle",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "664",
            "id": 74,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "nearle@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Irwin  Bracher",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "416",
            "id": 102,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "hr_id": "G07S2",
            "email": "bracher@niceschool.edu"
        },
        {
            "name": "Meghann Josy Dows",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "168",
            "id": 130,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "jdows@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Eleen Vicki Dunridge",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "330",
            "id": 158,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "hr_id": "G07S2",
            "email": "vdunridge@niceschool.edu"
        },
        {
            "name": "Mada  Pleaden",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "814",
            "id": 186,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "pleaden@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Lynette Dolorita Wistance",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "53",
            "id": 214,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "dwistance@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Brietta  Lorking",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "420",
            "id": 242,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "hr_id": "G07S2",
            "email": "lorking@niceschool.edu"
        },
        {
            "name": "Waylen Whitney Thomtson",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "426",
            "id": 270,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "hr_id": "G07S2",
            "email": "wthomtson@niceschool.edu"
        },
        {
            "name": "Nariko Atlanta Vann",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "55",
            "id": 298,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "avann@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Madeleine Viviene Dwane",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "786",
            "id": 326,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "vdwane@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Amalita Kari Babbs",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "59",
            "id": 354,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "kbabbs@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Rubia Alanna Sperski",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "566",
            "id": 382,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "asperski@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Freeman Patin Bear",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "17",
            "id": 410,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "pbear@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Lyn Bertrand McSwan",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "562",
            "id": 438,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "hr_id": "G07S2",
            "email": "bmcswan@niceschool.edu"
        },
        {
            "name": "Obadiah Ximenez SMalecombe",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "689",
            "id": 466,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "xsMalecombe@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Wit Flem Bynert",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "557",
            "id": 494,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "hr_id": "G07S2",
            "email": "fbynert@niceschool.edu"
        },
        {
            "name": "Rolph Ahmad Milbourne",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "624",
            "id": 522,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "hr_id": "G07S2",
            "email": "amilbourne@niceschool.edu"
        },
        {
            "name": "Lily Etta Somersett",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "334",
            "id": 550,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "esomersett@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Dannye  Gerish",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "181",
            "id": 578,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "gerish@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Jocko  Vaar",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "193",
            "id": 606,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "hr_id": "G07S2",
            "email": "vaar@niceschool.edu"
        },
        {
            "name": "Kai Mureil Hardisty",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "800",
            "id": 634,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "hr_id": "G07S2",
            "email": "mhardisty@niceschool.edu"
        },
        {
            "name": "Dougie Nappy Sarchwell",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "985",
            "id": 662,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "nsarchwell@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Josee Denni Roxburch",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "547",
            "id": 690,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "droxburch@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Andrea  Diemer",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "412",
            "id": 718,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "hr_id": "G07S2",
            "email": "diemer@niceschool.edu"
        },
        {
            "name": "Fancie Emyle Ranklin",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "210",
            "id": 746,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "eranklin@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Gonzales  Cudbertson",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "185",
            "id": 774,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "cudbertson@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Gav Worthington Scammell",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "491",
            "id": 802,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "wscammell@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Giffie Devin Cardall",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "65",
            "id": 830,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "hr_id": "G07S2",
            "email": "dcardall@niceschool.edu"
        },
        {
            "name": "Luise Frayda O'Skehan",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "324",
            "id": 858,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "fo'skehan@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Leonid Dex Woods",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "642",
            "id": 886,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "dwoods@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Whitby Peyter Lyvon",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "836",
            "id": 914,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "plyvon@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Salvador Carter Hazeldean",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "271",
            "id": 942,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "chazeldean@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Jilleen  Deboy",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "665",
            "id": 970,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "deboy@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Patrizio Maxie Stollenbecker",
            "level": "MS",
            "grade": "7",
            "homeroom": "Nantou",
            "student_id": "300",
            "id": 998,
            "hr_teacher_name": "Dr. Scarlett Grant",
            "email": "mstollenbecker@niceschool.edu",
            "hr_id": "G07S2"
        },
        {
            "name": "Tobie Mac Cheeney",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "932",
            "id": 19,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "mcheeney@niceschool.edu"
        },
        {
            "name": "Krystle Denni Walak",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "515",
            "id": 47,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "dwalak@niceschool.edu"
        },
        {
            "name": "Tull Edvard Karpol",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "595",
            "id": 75,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "ekarpol@niceschool.edu"
        },
        {
            "name": "Halette Kevina Kleinsinger",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "179",
            "id": 103,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "kkleinsinger@niceschool.edu"
        },
        {
            "name": "Monique Kerrill Stoves",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "3",
            "id": 131,
            "hr_teacher_name": "Mr. Ron Foxley",
            "email": "kstoves@niceschool.edu",
            "hr_id": "G08S1"
        },
        {
            "name": "Rudolfo  Jarmaine",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "590",
            "id": 159,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "jarmaine@niceschool.edu"
        },
        {
            "name": "Sharon Joli O'Caherny",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "72",
            "id": 187,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "jo'caherny@niceschool.edu"
        },
        {
            "name": "Suzanna  Norrey",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "139",
            "id": 215,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "norrey@niceschool.edu"
        },
        {
            "name": "Caresa Cherianne Spyby",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "483",
            "id": 243,
            "hr_teacher_name": "Mr. Ron Foxley",
            "email": "cspyby@niceschool.edu",
            "hr_id": "G08S1"
        },
        {
            "name": "Doro Carmelia Monument",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "617",
            "id": 271,
            "hr_teacher_name": "Mr. Ron Foxley",
            "email": "cmonument@niceschool.edu",
            "hr_id": "G08S1"
        },
        {
            "name": "Bron Derrek Vannucci",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "850",
            "id": 299,
            "hr_teacher_name": "Mr. Ron Foxley",
            "email": "dvannucci@niceschool.edu",
            "hr_id": "G08S1"
        },
        {
            "name": "Robinia Rozalie Sparwell",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "327",
            "id": 327,
            "hr_teacher_name": "Mr. Ron Foxley",
            "email": "rsparwell@niceschool.edu",
            "hr_id": "G08S1"
        },
        {
            "name": "Eileen Mela Burbidge",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "772",
            "id": 355,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "mburbidge@niceschool.edu"
        },
        {
            "name": "Marcellina Cornie Tellesson",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "150",
            "id": 383,
            "hr_teacher_name": "Mr. Ron Foxley",
            "email": "ctellesson@niceschool.edu",
            "hr_id": "G08S1"
        },
        {
            "name": "Peterus Renaldo Sleath",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "859",
            "id": 411,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "rsleath@niceschool.edu"
        },
        {
            "name": "Alric Davin Waren",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "303",
            "id": 439,
            "hr_teacher_name": "Mr. Ron Foxley",
            "email": "dwaren@niceschool.edu",
            "hr_id": "G08S1"
        },
        {
            "name": "Cori  Kingman",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "116",
            "id": 467,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "kingman@niceschool.edu"
        },
        {
            "name": "Kendall Ward Sails",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "716",
            "id": 495,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "wsails@niceschool.edu"
        },
        {
            "name": "Den Gerrie Retchless",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "315",
            "id": 523,
            "hr_teacher_name": "Mr. Ron Foxley",
            "email": "gretchless@niceschool.edu",
            "hr_id": "G08S1"
        },
        {
            "name": "Sully Bill Pauly",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "12",
            "id": 551,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "bpauly@niceschool.edu"
        },
        {
            "name": "Alastair  Pyvis",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "797",
            "id": 579,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "pyvis@niceschool.edu"
        },
        {
            "name": "Carey  Bernhart",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "967",
            "id": 607,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "bernhart@niceschool.edu"
        },
        {
            "name": "Rickert  Heinlein",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "490",
            "id": 635,
            "hr_teacher_name": "Mr. Ron Foxley",
            "email": "heinlein@niceschool.edu",
            "hr_id": "G08S1"
        },
        {
            "name": "Camala  Scandrite",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "936",
            "id": 663,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "scandrite@niceschool.edu"
        },
        {
            "name": "Analise  Koppke",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "846",
            "id": 691,
            "hr_teacher_name": "Mr. Ron Foxley",
            "email": "koppke@niceschool.edu",
            "hr_id": "G08S1"
        },
        {
            "name": "Linnea Hailee Roath",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "707",
            "id": 719,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "hroath@niceschool.edu"
        },
        {
            "name": "Bren Afton Buffery",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "592",
            "id": 747,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "abuffery@niceschool.edu"
        },
        {
            "name": "Dianna  Breakey",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "675",
            "id": 775,
            "hr_teacher_name": "Mr. Ron Foxley",
            "email": "breakey@niceschool.edu",
            "hr_id": "G08S1"
        },
        {
            "name": "Lancelot  Meryett",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "542",
            "id": 803,
            "hr_teacher_name": "Mr. Ron Foxley",
            "email": "meryett@niceschool.edu",
            "hr_id": "G08S1"
        },
        {
            "name": "Madelina  Crolly",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "373",
            "id": 831,
            "hr_teacher_name": "Mr. Ron Foxley",
            "email": "crolly@niceschool.edu",
            "hr_id": "G08S1"
        },
        {
            "name": "Jobie Gail Posnett",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "98",
            "id": 859,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "gposnett@niceschool.edu"
        },
        {
            "name": "Kimbell Aubert Treven",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "795",
            "id": 887,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "atreven@niceschool.edu"
        },
        {
            "name": "Caryl  Couser",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "748",
            "id": 915,
            "hr_teacher_name": "Mr. Ron Foxley",
            "email": "couser@niceschool.edu",
            "hr_id": "G08S1"
        },
        {
            "name": "Galen  Seamon",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "731",
            "id": 943,
            "hr_teacher_name": "Mr. Ron Foxley",
            "hr_id": "G08S1",
            "email": "seamon@niceschool.edu"
        },
        {
            "name": "Burnard Eugenius Bussel",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "473",
            "id": 971,
            "hr_teacher_name": "Mr. Ron Foxley",
            "email": "ebussel@niceschool.edu",
            "hr_id": "G08S1"
        },
        {
            "name": "Izak Thor Lies",
            "level": "MS",
            "grade": "8",
            "homeroom": "Pingtung",
            "student_id": "640",
            "id": 999,
            "hr_teacher_name": "Mr. Ron Foxley",
            "email": "tlies@niceschool.edu",
            "hr_id": "G08S1"
        },
        {
            "name": "Lucine Cyndy Chasney",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "354",
            "id": 20,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "cchasney@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Mort  Spelwood",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "302",
            "id": 48,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "spelwood@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Hagen Isidro Chaffey",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "39",
            "id": 76,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "ichaffey@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Colene Selia Moryson",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "103",
            "id": 104,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "smoryson@niceschool.edu"
        },
        {
            "name": "Gilbertina Cherlyn Carvill",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "990",
            "id": 132,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "ccarvill@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Kai  Withrington",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "545",
            "id": 160,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "withrington@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Ahmad Sargent Schlagtmans",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "755",
            "id": 188,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "sschlagtmans@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Stearne  Liggins",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "317",
            "id": 216,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "liggins@niceschool.edu"
        },
        {
            "name": "Harbert  Kime",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "14",
            "id": 244,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "kime@niceschool.edu"
        },
        {
            "name": "Albina  Lovat",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "666",
            "id": 272,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "lovat@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Querida  Agutter",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "492",
            "id": 300,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "agutter@niceschool.edu"
        },
        {
            "name": "Dreddy  Pedycan",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "155",
            "id": 328,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "pedycan@niceschool.edu"
        },
        {
            "name": "Katina  Humbles",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "239",
            "id": 356,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "humbles@niceschool.edu"
        },
        {
            "name": "Zitella Nicol Cromley",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "633",
            "id": 384,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "ncromley@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Anderea Randene Beinke",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "349",
            "id": 412,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "rbeinke@niceschool.edu"
        },
        {
            "name": "Anneliese  Smoote",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "983",
            "id": 440,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "smoote@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Keven Lorenzo Ely",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "767",
            "id": 468,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "lely@niceschool.edu"
        },
        {
            "name": "Wilbert Hamlen Cisar",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "81",
            "id": 496,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "hcisar@niceschool.edu"
        },
        {
            "name": "Christie Fredericka Jozef",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "468",
            "id": 524,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "fjozef@niceschool.edu"
        },
        {
            "name": "Towny Gail Froment",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "826",
            "id": 552,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "gfroment@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Tracie  Bachman",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "871",
            "id": 580,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "bachman@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Hetty Lorene Bee",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "140",
            "id": 608,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "lbee@niceschool.edu"
        },
        {
            "name": "Reinald Crawford Pudden",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "267",
            "id": 636,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "cpudden@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Annadiane  Rockwell",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "776",
            "id": 664,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "rockwell@niceschool.edu"
        },
        {
            "name": "Nance  Pock",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "576",
            "id": 692,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "pock@niceschool.edu"
        },
        {
            "name": "Madelena Tersina Szwandt",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "318",
            "id": 720,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "tszwandt@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Eveleen Amalia Ivashev",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "10",
            "id": 748,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "aivashev@niceschool.edu"
        },
        {
            "name": "Wolfgang  Cary",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "686",
            "id": 776,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "cary@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Ingeberg Glori Penvarne",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "96",
            "id": 804,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "gpenvarne@niceschool.edu"
        },
        {
            "name": "Darbie Goldi Pharaoh",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "555",
            "id": 832,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "gpharaoh@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Alejandrina Constancy Follin",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "837",
            "id": 860,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "cfollin@niceschool.edu"
        },
        {
            "name": "Theadora  Mallion",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "321",
            "id": 888,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "mallion@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Pattin Gustavo Simkovich",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "806",
            "id": 916,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "gsimkovich@niceschool.edu"
        },
        {
            "name": "Oliviero Herby Paterno",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "894",
            "id": 944,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "hpaterno@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Britt Farlie Salway",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "460",
            "id": 972,
            "hr_teacher_name": "Mr. Mike Lucas",
            "email": "fsalway@niceschool.edu",
            "hr_id": "G08S2"
        },
        {
            "name": "Amitie Annnora Saull",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "635",
            "id": 1000,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "asaull@niceschool.edu"
        },
        {
            "name": "Test   Account",
            "level": "MS",
            "grade": "8",
            "homeroom": "Puzi",
            "student_id": "1001",
            "id": 1001,
            "hr_teacher_name": "Mr. Mike Lucas",
            "hr_id": "G08S2",
            "email": "testuser01@dishs.tp.edu.tw"
        },
        {
            "name": "Laina  Caulwell",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "919",
            "id": 17,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "caulwell@niceschool.edu"
        },
        {
            "name": "Larine Inger Vankov",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "653",
            "id": 45,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "ivankov@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Duffie  Knevett",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "494",
            "id": 73,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "knevett@niceschool.edu"
        },
        {
            "name": "Averil  Lindeberg",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "160",
            "id": 101,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "lindeberg@niceschool.edu"
        },
        {
            "name": "Roosevelt  Tresvina",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "841",
            "id": 129,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "tresvina@niceschool.edu"
        },
        {
            "name": "Penn Balduin Dougliss",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "138",
            "id": 157,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "bdougliss@niceschool.edu"
        },
        {
            "name": "Betteann Lillian Lello",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "537",
            "id": 185,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "llello@niceschool.edu"
        },
        {
            "name": "Jammie Sheila-kathryn Ling",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "246",
            "id": 213,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "sling@niceschool.edu"
        },
        {
            "name": "Meggi Lenka Debnam",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "992",
            "id": 241,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "ldebnam@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Hanni  Diviny",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "257",
            "id": 269,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "diviny@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Laney  Mariyushkin",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "987",
            "id": 297,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "mariyushkin@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Archie Kenon Cankett",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "345",
            "id": 325,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "kcankett@niceschool.edu"
        },
        {
            "name": "Ryan Benjie Meeson",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "855",
            "id": 353,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "bmeeson@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Ab Davie Beebe",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "228",
            "id": 381,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "dbeebe@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Markus  Drage",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "230",
            "id": 409,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "drage@niceschool.edu"
        },
        {
            "name": "Janine  Copner",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "261",
            "id": 437,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "copner@niceschool.edu"
        },
        {
            "name": "Elli Doll Reddan",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "289",
            "id": 465,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "dreddan@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Ranee Arden O'Carney",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "45",
            "id": 493,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "ao'carney@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Ingram Tomaso Wapplington",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "662",
            "id": 521,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "twapplington@niceschool.edu"
        },
        {
            "name": "Rickard  Kitchenside",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "273",
            "id": 549,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "kitchenside@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Francklyn Gasparo McCallam",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "694",
            "id": 577,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "gmccallam@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Allsun  Kalinowsky",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "713",
            "id": 605,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "kalinowsky@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Dino Huntington Kaubisch",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "438",
            "id": 633,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "hkaubisch@niceschool.edu"
        },
        {
            "name": "Noni Alene Bogart",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "219",
            "id": 661,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "abogart@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Koral  Koene",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "892",
            "id": 689,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "koene@niceschool.edu"
        },
        {
            "name": "Claudette Halette Duckfield",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "646",
            "id": 717,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "hduckfield@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Korney Sianna Routh",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "205",
            "id": 745,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "srouth@niceschool.edu"
        },
        {
            "name": "Marylin Alison Emanulsson",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "118",
            "id": 773,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "aemanulsson@niceschool.edu"
        },
        {
            "name": "Celia  MacCulloch",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "481",
            "id": 801,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "macculloch@niceschool.edu"
        },
        {
            "name": "Cart Silvano Reynish",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "157",
            "id": 829,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "sreynish@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Timoteo  Glitherow",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "803",
            "id": 857,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "glitherow@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Padraic Hill Bossons",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "180",
            "id": 885,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "hbossons@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Kaylyn Alane Gelderd",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "875",
            "id": 913,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "agelderd@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Brian Gustavo Madigan",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "189",
            "id": 941,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "gmadigan@niceschool.edu"
        },
        {
            "name": "Dorella Winnifred Braunthal",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "258",
            "id": 969,
            "hr_teacher_name": "Mr. Tyler Smith",
            "email": "wbraunthal@niceschool.edu",
            "hr_id": "G07S1"
        },
        {
            "name": "Jarrod  Reace",
            "level": "MS",
            "grade": "7",
            "homeroom": "Sanxia",
            "student_id": "361",
            "id": 997,
            "hr_teacher_name": "Mr. Tyler Smith",
            "hr_id": "G07S1",
            "email": "reace@niceschool.edu"
        },
        {
            "name": "Caressa Maggie Abrey",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "514",
            "id": 14,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "mabrey@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Brigg Svend Willmore",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "310",
            "id": 42,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "swillmore@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Alfie  Gamett",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "972",
            "id": 70,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "gamett@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Roger Torry Aulds",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "126",
            "id": 98,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "taulds@niceschool.edu"
        },
        {
            "name": "Bo Barclay McGarel",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "499",
            "id": 126,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "bmcgarel@niceschool.edu"
        },
        {
            "name": "Silvio Nicola Valente",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "117",
            "id": 154,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "nvalente@niceschool.edu"
        },
        {
            "name": "Frankie Fancy Ivchenko",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "955",
            "id": 182,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "fivchenko@niceschool.edu"
        },
        {
            "name": "Lavina Stafani Espino",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "693",
            "id": 210,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "sespino@niceschool.edu"
        },
        {
            "name": "Yorgo Bryn Clapson",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "858",
            "id": 238,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "bclapson@niceschool.edu"
        },
        {
            "name": "Harrison  Gillebert",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "414",
            "id": 266,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "gillebert@niceschool.edu"
        },
        {
            "name": "Karel Justino Grisard",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "404",
            "id": 294,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "jgrisard@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Hersch Doy Twiggins",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "683",
            "id": 322,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "dtwiggins@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Shelby Nowell Burgon",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "487",
            "id": 350,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "nburgon@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Morgen  Tremble",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "227",
            "id": 378,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "tremble@niceschool.edu"
        },
        {
            "name": "Grenville Morry Vaugham",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "883",
            "id": 406,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "mvaugham@niceschool.edu"
        },
        {
            "name": "Anatola Cathyleen O'Donoghue",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "870",
            "id": 434,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "co'donoghue@niceschool.edu"
        },
        {
            "name": "Kristi Carrissa Macauley",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "823",
            "id": 462,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "cmacauley@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Madeline Marianna Sotheron",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "245",
            "id": 490,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "msotheron@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Concettina Livy Laise",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "777",
            "id": 518,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "llaise@niceschool.edu"
        },
        {
            "name": "Gayler Auberon Retter",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "864",
            "id": 546,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "aretter@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Anne Fifine Isakowicz",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "111",
            "id": 574,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "fisakowicz@niceschool.edu"
        },
        {
            "name": "Ninetta  Shurrock",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "524",
            "id": 602,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "shurrock@niceschool.edu"
        },
        {
            "name": "Samaria Laura Carnegie",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "31",
            "id": 630,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "lcarnegie@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Sunshine Mirabelle Kettlestringe",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "715",
            "id": 658,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "mkettlestringe@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Ellery Aleksandr State",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "831",
            "id": 686,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "astate@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Jessamyn Rasia Kordt",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "854",
            "id": 714,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "rkordt@niceschool.edu"
        },
        {
            "name": "Ranique Valaree Charlot",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "905",
            "id": 742,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "vcharlot@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Temp Hall Kleiner",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "77",
            "id": 770,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "hkleiner@niceschool.edu"
        },
        {
            "name": "Danita  Hawkes",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "478",
            "id": 798,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "hawkes@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Joachim  Ringham",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "251",
            "id": 826,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "ringham@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Blondell Bernardine Rosson",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "190",
            "id": 854,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "brosson@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Edouard Rollins Gathwaite",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "430",
            "id": 882,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "rgathwaite@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Melba Liane Follin",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "178",
            "id": 910,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "lfollin@niceschool.edu"
        },
        {
            "name": "Nola Guenevere Fairn",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "52",
            "id": 938,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "gfairn@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Alyda  Flounders",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "645",
            "id": 966,
            "hr_teacher_name": "Ms. Abbey Rees",
            "hr_id": "G05S2",
            "email": "flounders@niceschool.edu"
        },
        {
            "name": "Brier Lizette Sprott",
            "level": "LS",
            "grade": "5",
            "homeroom": "Shulin",
            "student_id": "907",
            "id": 994,
            "hr_teacher_name": "Ms. Abbey Rees",
            "email": "lsprott@niceschool.edu",
            "hr_id": "G05S2"
        },
        {
            "name": "Rubina Ruthy Wogden",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "939",
            "id": 21,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "rwogden@niceschool.edu"
        },
        {
            "name": "Aubrey Hillary Pawling",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "268",
            "id": 49,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "hpawling@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Tony Amelia Sunderland",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "500",
            "id": 77,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "asunderland@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Mechelle Sonia Fey",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "782",
            "id": 105,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "sfey@niceschool.edu"
        },
        {
            "name": "Clayson Natal Lardge",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "725",
            "id": 133,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "nlardge@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Dorotea Keslie Addinall",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "863",
            "id": 161,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "kaddinall@niceschool.edu"
        },
        {
            "name": "Dulci  Grishinov",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "486",
            "id": 189,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "grishinov@niceschool.edu"
        },
        {
            "name": "Vaughn Andy Wimpey",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "984",
            "id": 217,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "awimpey@niceschool.edu"
        },
        {
            "name": "Lazare Damiano Robinette",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "672",
            "id": 245,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "drobinette@niceschool.edu"
        },
        {
            "name": "Reilly  Shoreman",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "787",
            "id": 273,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "shoreman@niceschool.edu"
        },
        {
            "name": "Tann  Pargetter",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "288",
            "id": 301,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "pargetter@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Billy Enrico Cambden",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "348",
            "id": 329,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "ecambden@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Lidia Kipp Frayne",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "449",
            "id": 357,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "kfrayne@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Terencio  Lafrentz",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "165",
            "id": 385,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "lafrentz@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Kim Bald Lundbech",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "997",
            "id": 413,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "blundbech@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Magdaia Michaeline Warhurst",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "705",
            "id": 441,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "mwarhurst@niceschool.edu"
        },
        {
            "name": "Anthony Rodge Chainey",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "298",
            "id": 469,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "rchainey@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Adham Adolf Sully",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "480",
            "id": 497,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "asully@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Ritchie Lenard Shippey",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "104",
            "id": 525,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "lshippey@niceschool.edu"
        },
        {
            "name": "Marianne Lucienne Greatrex",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "1",
            "id": 553,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "lgreatrex@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Waylon Roarke Jaksic",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "497",
            "id": 581,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "rjaksic@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Sher  Askem",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "371",
            "id": 609,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "askem@niceschool.edu"
        },
        {
            "name": "Darby Garnet Veltmann",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "90",
            "id": 637,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "gveltmann@niceschool.edu"
        },
        {
            "name": "Friedrick  Tottie",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "169",
            "id": 665,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "tottie@niceschool.edu"
        },
        {
            "name": "Carmelia Evy Grafhom",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "170",
            "id": 693,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "egrafhom@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Justen Cecil Pullman",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "229",
            "id": 721,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "cpullman@niceschool.edu"
        },
        {
            "name": "Hardy  Porte",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "718",
            "id": 749,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "porte@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Mason Jarid Willgoss",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "879",
            "id": 777,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "jwillgoss@niceschool.edu"
        },
        {
            "name": "Brent  Cleland",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "780",
            "id": 805,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "cleland@niceschool.edu"
        },
        {
            "name": "Torey Amity Millott",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "622",
            "id": 833,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "amillott@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Miranda  Castenda",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "553",
            "id": 861,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "castenda@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Vicky Mureil Websdale",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "775",
            "id": 889,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "mwebsdale@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Wildon Keary Blackie",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "723",
            "id": 917,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "kblackie@niceschool.edu"
        },
        {
            "name": "Yancey  Leisman",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "949",
            "id": 945,
            "hr_teacher_name": "Ms. Jane Taylor",
            "hr_id": "G09S1",
            "email": "leisman@niceschool.edu"
        },
        {
            "name": "Peggie Karine Kilkenny",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taibao",
            "student_id": "521",
            "id": 973,
            "hr_teacher_name": "Ms. Jane Taylor",
            "email": "kkilkenny@niceschool.edu",
            "hr_id": "G09S1"
        },
        {
            "name": "Zondra  Adamov",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "768",
            "id": 3,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "adamov@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Cliff Lorin Searl",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "30",
            "id": 31,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "lsearl@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Cassandra Carry Fevers",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "439",
            "id": 59,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "cfevers@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Boonie  Grigoryov",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "277",
            "id": 87,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "grigoryov@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Phyllys Paule Ralling",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "596",
            "id": 115,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "pralling@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Rosalie  Embleton",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "580",
            "id": 143,
            "hr_teacher_name": "Ms. Marie Tobin",
            "hr_id": "GKS1",
            "email": "embleton@niceschool.edu"
        },
        {
            "name": "Avigdor Waylin Pynner",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "242",
            "id": 171,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "wpynner@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Giacopo Ash Hedden",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "325",
            "id": 199,
            "hr_teacher_name": "Ms. Marie Tobin",
            "hr_id": "GKS1",
            "email": "ahedden@niceschool.edu"
        },
        {
            "name": "Yasmeen Edna Warrick",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "175",
            "id": 227,
            "hr_teacher_name": "Ms. Marie Tobin",
            "hr_id": "GKS1",
            "email": "ewarrick@niceschool.edu"
        },
        {
            "name": "Laney Gardie Keneford",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "320",
            "id": 255,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "gkeneford@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Costanza Paolina Tapper",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "847",
            "id": 283,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "ptapper@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Sher Leonanie Blazey",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "459",
            "id": 311,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "lblazey@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Daryl Merola Firk",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "188",
            "id": 339,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "mfirk@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Jim  Langcastle",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "469",
            "id": 367,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "langcastle@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Gayler Weston Jentgens",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "526",
            "id": 395,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "wjentgens@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Lyndsay  Styant",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "632",
            "id": 423,
            "hr_teacher_name": "Ms. Marie Tobin",
            "hr_id": "GKS1",
            "email": "styant@niceschool.edu"
        },
        {
            "name": "Lani  Fike",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "922",
            "id": 451,
            "hr_teacher_name": "Ms. Marie Tobin",
            "hr_id": "GKS1",
            "email": "fike@niceschool.edu"
        },
        {
            "name": "Ula Matilde O'Griffin",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "276",
            "id": 479,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "mo'griffin@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Kaine Rabi Obeney",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "260",
            "id": 507,
            "hr_teacher_name": "Ms. Marie Tobin",
            "hr_id": "GKS1",
            "email": "robeney@niceschool.edu"
        },
        {
            "name": "Joshia Aleksandr Veltmann",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "670",
            "id": 535,
            "hr_teacher_name": "Ms. Marie Tobin",
            "hr_id": "GKS1",
            "email": "aveltmann@niceschool.edu"
        },
        {
            "name": "Crin  Saura",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "918",
            "id": 563,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "saura@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Loretta Lory Claire",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "109",
            "id": 591,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "lclaire@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Emlyn Ebonee Dorning",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "428",
            "id": 619,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "edorning@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Marley  Allmen",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "843",
            "id": 647,
            "hr_teacher_name": "Ms. Marie Tobin",
            "hr_id": "GKS1",
            "email": "allmen@niceschool.edu"
        },
        {
            "name": "Obie Hurley Crunkhorn",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "762",
            "id": 675,
            "hr_teacher_name": "Ms. Marie Tobin",
            "hr_id": "GKS1",
            "email": "hcrunkhorn@niceschool.edu"
        },
        {
            "name": "Katlin Nissy Bletcher",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "201",
            "id": 703,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "nbletcher@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Lela  Vann",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "567",
            "id": 731,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "vann@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Vevay Maureen Janowicz",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "641",
            "id": 759,
            "hr_teacher_name": "Ms. Marie Tobin",
            "hr_id": "GKS1",
            "email": "mjanowicz@niceschool.edu"
        },
        {
            "name": "Man Wake Lanktree",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "362",
            "id": 787,
            "hr_teacher_name": "Ms. Marie Tobin",
            "hr_id": "GKS1",
            "email": "wlanktree@niceschool.edu"
        },
        {
            "name": "Monro Sal Concannon",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "400",
            "id": 815,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "sconcannon@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Yehudit Lambert Dornin",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "951",
            "id": 843,
            "hr_teacher_name": "Ms. Marie Tobin",
            "hr_id": "GKS1",
            "email": "ldornin@niceschool.edu"
        },
        {
            "name": "Rudyard  Pistol",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "692",
            "id": 871,
            "hr_teacher_name": "Ms. Marie Tobin",
            "hr_id": "GKS1",
            "email": "pistol@niceschool.edu"
        },
        {
            "name": "Derrik  Thal",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "60",
            "id": 899,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "thal@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Trudey Lorena Talloe",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "744",
            "id": 927,
            "hr_teacher_name": "Ms. Marie Tobin",
            "hr_id": "GKS1",
            "email": "ltalloe@niceschool.edu"
        },
        {
            "name": "Prue Ardath Emanuelov",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "199",
            "id": 955,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "aemanuelov@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Lenore Marci Thomton",
            "level": "LS",
            "grade": "K",
            "homeroom": "Taichung",
            "student_id": "510",
            "id": 983,
            "hr_teacher_name": "Ms. Marie Tobin",
            "email": "mthomton@niceschool.edu",
            "hr_id": "GKS1"
        },
        {
            "name": "Tyrone Dennet Sliman",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "926",
            "id": 27,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "dsliman@niceschool.edu"
        },
        {
            "name": "Harp Marcos Prew",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "447",
            "id": 55,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "mprew@niceschool.edu"
        },
        {
            "name": "Fae Elle Bartoli",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "365",
            "id": 83,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "email": "ebartoli@niceschool.edu",
            "hr_id": "G12S1"
        },
        {
            "name": "Tammie Nari Fillary",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "94",
            "id": 111,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "email": "nfillary@niceschool.edu",
            "hr_id": "G12S1"
        },
        {
            "name": "Toddie Laney Androsik",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "370",
            "id": 139,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "email": "landrosik@niceschool.edu",
            "hr_id": "G12S1"
        },
        {
            "name": "Norris  Novis",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "908",
            "id": 167,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "novis@niceschool.edu"
        },
        {
            "name": "Barrie Maynard Casini",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "19",
            "id": 195,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "email": "mcasini@niceschool.edu",
            "hr_id": "G12S1"
        },
        {
            "name": "Ada  Gribbin",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "805",
            "id": 223,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "gribbin@niceschool.edu"
        },
        {
            "name": "Harli  Pruce",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "304",
            "id": 251,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "email": "pruce@niceschool.edu",
            "hr_id": "G12S1"
        },
        {
            "name": "Madel Emeline Bunstone",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "23",
            "id": 279,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "email": "ebunstone@niceschool.edu",
            "hr_id": "G12S1"
        },
        {
            "name": "Marysa  Iltchev",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "708",
            "id": 307,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "email": "iltchev@niceschool.edu",
            "hr_id": "G12S1"
        },
        {
            "name": "Bo Allister Purtell",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "710",
            "id": 335,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "apurtell@niceschool.edu"
        },
        {
            "name": "Matty Hartwell Minichillo",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "637",
            "id": 363,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "email": "hminichillo@niceschool.edu",
            "hr_id": "G12S1"
        },
        {
            "name": "Addi Linnea Moulsdall",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "184",
            "id": 391,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "email": "lmoulsdall@niceschool.edu",
            "hr_id": "G12S1"
        },
        {
            "name": "Rochester Rab Yeo",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "243",
            "id": 419,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "ryeo@niceschool.edu"
        },
        {
            "name": "Melanie Ange Porrett",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "781",
            "id": 447,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "email": "aporrett@niceschool.edu",
            "hr_id": "G12S1"
        },
        {
            "name": "Blanca Hertha Milby",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "129",
            "id": 475,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "hmilby@niceschool.edu"
        },
        {
            "name": "Garv Nestor Button",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "182",
            "id": 503,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "email": "nbutton@niceschool.edu",
            "hr_id": "G12S1"
        },
        {
            "name": "Carce Christophorus Barz",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "436",
            "id": 531,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "cbarz@niceschool.edu"
        },
        {
            "name": "Lyon Micah Fyall",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "337",
            "id": 559,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "email": "mfyall@niceschool.edu",
            "hr_id": "G12S1"
        },
        {
            "name": "Mady Rosemary Conford",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "153",
            "id": 587,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "rconford@niceschool.edu"
        },
        {
            "name": "Care Job Ausiello",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "549",
            "id": 615,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "jausiello@niceschool.edu"
        },
        {
            "name": "Dulcie Ebonee Robertazzi",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "584",
            "id": 643,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "email": "erobertazzi@niceschool.edu",
            "hr_id": "G12S1"
        },
        {
            "name": "Franky Cassondra Hamber",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "947",
            "id": 671,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "chamber@niceschool.edu"
        },
        {
            "name": "Glynis Martha Darrigrand",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "886",
            "id": 699,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "mdarrigrand@niceschool.edu"
        },
        {
            "name": "Towney Boris Fairhurst",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "701",
            "id": 727,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "email": "bfairhurst@niceschool.edu",
            "hr_id": "G12S1"
        },
        {
            "name": "Garnet  Faiers",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "380",
            "id": 755,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "faiers@niceschool.edu"
        },
        {
            "name": "Dominique  Burgon",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "107",
            "id": 783,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "burgon@niceschool.edu"
        },
        {
            "name": "Marcelle  Klaassens",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "706",
            "id": 811,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "klaassens@niceschool.edu"
        },
        {
            "name": "Auroora Whitney Setterfield",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "244",
            "id": 839,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "email": "wsetterfield@niceschool.edu",
            "hr_id": "G12S1"
        },
        {
            "name": "Cody Tyrus Antognoni",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "120",
            "id": 867,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "email": "tantognoni@niceschool.edu",
            "hr_id": "G12S1"
        },
        {
            "name": "Sheila-kathryn  Burndred",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "726",
            "id": 895,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "burndred@niceschool.edu"
        },
        {
            "name": "Gilberta Elie Radeliffe",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "832",
            "id": 923,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "eradeliffe@niceschool.edu"
        },
        {
            "name": "Bennie Nil Matushevich",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "673",
            "id": 951,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "nmatushevich@niceschool.edu"
        },
        {
            "name": "Maressa Leora Aberdeen",
            "level": "HS",
            "grade": "12",
            "homeroom": "Taihoku",
            "student_id": "989",
            "id": 979,
            "hr_teacher_name": "Dr. Hailey Shaw",
            "hr_id": "G12S1",
            "email": "laberdeen@niceschool.edu"
        },
        {
            "name": "Clyve Russell Cadwallader",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "872",
            "id": 4,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "rcadwallader@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Anthea Shayne Sherrott",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "195",
            "id": 32,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "ssherrott@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Joaquin Jerrie Cullinan",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "578",
            "id": 60,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "jcullinan@niceschool.edu"
        },
        {
            "name": "Meggie  Bondley",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "961",
            "id": 88,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "bondley@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Lib  Cestard",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "29",
            "id": 116,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "cestard@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Robyn Dyana Stollsteiner",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "375",
            "id": 144,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "dstollsteiner@niceschool.edu"
        },
        {
            "name": "Isabeau Ilsa Wyrill",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "352",
            "id": 172,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "iwyrill@niceschool.edu"
        },
        {
            "name": "Marcelline Willette Arrigucci",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "237",
            "id": 200,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "warrigucci@niceschool.edu"
        },
        {
            "name": "Jereme Geoffry Frensch",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "784",
            "id": 228,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "gfrensch@niceschool.edu"
        },
        {
            "name": "Merwyn Thorndike Pappin",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "891",
            "id": 256,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "tpappin@niceschool.edu"
        },
        {
            "name": "Chaim Antoine Fideler",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "538",
            "id": 284,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "afideler@niceschool.edu"
        },
        {
            "name": "Lilah Vivianne Meake",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "207",
            "id": 312,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "vmeake@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Cort  Fearnsides",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "475",
            "id": 340,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "fearnsides@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Rolf Noel Sambals",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "236",
            "id": 368,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "nsambals@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Orion  Bohlje",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "747",
            "id": 396,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "bohlje@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Audy Elsi Brigstock",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "452",
            "id": 424,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "ebrigstock@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Rivkah Judith Elwyn",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "618",
            "id": 452,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "jelwyn@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Joy Arliene McCarle",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "38",
            "id": 480,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "amccarle@niceschool.edu"
        },
        {
            "name": "Gilbert  Cudde",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "283",
            "id": 508,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "cudde@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Ola  Craggs",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "399",
            "id": 536,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "craggs@niceschool.edu"
        },
        {
            "name": "Clevey Darrell Mole",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "328",
            "id": 564,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "dmole@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Silvain  Skrine",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "323",
            "id": 592,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "skrine@niceschool.edu"
        },
        {
            "name": "Cobbie Reuben Bewsey",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "281",
            "id": 620,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "rbewsey@niceschool.edu"
        },
        {
            "name": "Nelli Frances Caughey",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "849",
            "id": 648,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "fcaughey@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Antonin Vincent Dimsdale",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "423",
            "id": 676,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "vdimsdale@niceschool.edu"
        },
        {
            "name": "Aggy Noni Twelves",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "418",
            "id": 704,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "ntwelves@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Ianthe Ariela Mytton",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "450",
            "id": 732,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "amytton@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Kerri  MacPake",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "616",
            "id": 760,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "macpake@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Kim  Everit",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "216",
            "id": 788,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "everit@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Liv  Trammel",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "944",
            "id": 816,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "email": "trammel@niceschool.edu",
            "hr_id": "GKS2"
        },
        {
            "name": "Evania  Eddoes",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "415",
            "id": 844,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "eddoes@niceschool.edu"
        },
        {
            "name": "Ilsa Leilah Alenikov",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "461",
            "id": 872,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "lalenikov@niceschool.edu"
        },
        {
            "name": "Aldus  Rubenov",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "344",
            "id": 900,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "rubenov@niceschool.edu"
        },
        {
            "name": "Minny Viv Kermode",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "296",
            "id": 928,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "vkermode@niceschool.edu"
        },
        {
            "name": "Janos Garrard Dummer",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "297",
            "id": 956,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "gdummer@niceschool.edu"
        },
        {
            "name": "Dannie Serena Munkton",
            "level": "LS",
            "grade": "K",
            "homeroom": "Tainan",
            "student_id": "250",
            "id": 984,
            "hr_teacher_name": "Ms. Agnes Tobin",
            "hr_id": "GKS2",
            "email": "smunkton@niceschool.edu"
        },
        {
            "name": "Marlyn  Polack",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "4",
            "id": 5,
            "hr_teacher_name": "Ms. Havana Mooney",
            "hr_id": "G01S1",
            "email": "polack@niceschool.edu"
        },
        {
            "name": "Angelica  Ivchenko",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "291",
            "id": 33,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "ivchenko@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Tim  Sampson",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "11",
            "id": 61,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "tsampson@dishs.tp.edu.tw"
        },
        {
            "name": "Cedric Llywellyn Fell",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "1000",
            "id": 89,
            "hr_teacher_name": "Ms. Havana Mooney",
            "hr_id": "G01S1",
            "email": "lfell@niceschool.edu"
        },
        {
            "name": "Callie  Wohler",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "350",
            "id": 117,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "wohler@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Urson  Woofinden",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "290",
            "id": 145,
            "hr_teacher_name": "Ms. Havana Mooney",
            "hr_id": "G01S1",
            "email": "woofinden@niceschool.edu"
        },
        {
            "name": "Shannon Oralia Petschelt",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "453",
            "id": 173,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "opetschelt@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Shaw Barnabas Eagar",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "411",
            "id": 201,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "beagar@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Harwilll Tuckie Iverson",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "853",
            "id": 229,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "tiverson@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Diane Chelsea Reglar",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "979",
            "id": 257,
            "hr_teacher_name": "Ms. Havana Mooney",
            "hr_id": "G01S1",
            "email": "creglar@niceschool.edu"
        },
        {
            "name": "Seana Farra Clayton",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "568",
            "id": 285,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "fclayton@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Ben Valle Dalziel",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "874",
            "id": 313,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "vdalziel@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Stanly Sherwood Spritt",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "9",
            "id": 341,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "sspritt@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Chastity Laverne Lenoir",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "852",
            "id": 369,
            "hr_teacher_name": "Ms. Havana Mooney",
            "hr_id": "G01S1",
            "email": "llenoir@niceschool.edu"
        },
        {
            "name": "Ephrayim  Padgett",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "816",
            "id": 397,
            "hr_teacher_name": "Ms. Havana Mooney",
            "hr_id": "G01S1",
            "email": "padgett@niceschool.edu"
        },
        {
            "name": "Niki Spence Scanderet",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "311",
            "id": 425,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "sscanderet@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Lauritz Spenser Osorio",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "329",
            "id": 453,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "sosorio@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Berk Niven Hakking",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "339",
            "id": 481,
            "hr_teacher_name": "Ms. Havana Mooney",
            "hr_id": "G01S1",
            "email": "nhakking@niceschool.edu"
        },
        {
            "name": "Alvina Kimberli Raggitt",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "916",
            "id": 509,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "kraggitt@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Bailey Giacopo Craddock",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "105",
            "id": 537,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "gcraddock@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Lise Emera Le febre",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "28",
            "id": 565,
            "hr_teacher_name": "Ms. Havana Mooney",
            "hr_id": "G01S1",
            "email": "ele febre@niceschool.edu"
        },
        {
            "name": "Ker Benton Reddel",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "457",
            "id": 593,
            "hr_teacher_name": "Ms. Havana Mooney",
            "hr_id": "G01S1",
            "email": "breddel@niceschool.edu"
        },
        {
            "name": "Vikki  Switzer",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "741",
            "id": 621,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "switzer@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Gerianne  Peascod",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "561",
            "id": 649,
            "hr_teacher_name": "Ms. Havana Mooney",
            "hr_id": "G01S1",
            "email": "peascod@niceschool.edu"
        },
        {
            "name": "Dreddy Leora Ballam",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "410",
            "id": 677,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "lballam@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Gan Oswell Dymoke",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "971",
            "id": 705,
            "hr_teacher_name": "Ms. Havana Mooney",
            "hr_id": "G01S1",
            "email": "odymoke@niceschool.edu"
        },
        {
            "name": "Cilka Bobette Lincey",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "403",
            "id": 733,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "blincey@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Brinn  Baldack",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "379",
            "id": 761,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "baldack@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Garnet Dennie Tolhurst",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "963",
            "id": 789,
            "hr_teacher_name": "Ms. Havana Mooney",
            "hr_id": "G01S1",
            "email": "dtolhurst@niceschool.edu"
        },
        {
            "name": "Tabor Carlin Marchent",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "881",
            "id": 817,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "cmarchent@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Genevra  Ranshaw",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "424",
            "id": 845,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "ranshaw@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Germayne Paulie New",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "18",
            "id": 873,
            "hr_teacher_name": "Ms. Havana Mooney",
            "hr_id": "G01S1",
            "email": "pnew@niceschool.edu"
        },
        {
            "name": "Harley Gene Meran",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "981",
            "id": 901,
            "hr_teacher_name": "Ms. Havana Mooney",
            "hr_id": "G01S1",
            "email": "gmeran@niceschool.edu"
        },
        {
            "name": "Jamie Hagen Padgett",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "679",
            "id": 929,
            "hr_teacher_name": "Ms. Havana Mooney",
            "hr_id": "G01S1",
            "email": "hpadgett@niceschool.edu"
        },
        {
            "name": "Dael Bron Caulkett",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "376",
            "id": 957,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "bcaulkett@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Conway Stafford Farrance",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taipei",
            "student_id": "154",
            "id": 985,
            "hr_teacher_name": "Ms. Havana Mooney",
            "email": "sfarrance@niceschool.edu",
            "hr_id": "G01S1"
        },
        {
            "name": "Caesar Hasheem Fleischmann",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "159",
            "id": 22,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "hfleischmann@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Rolfe  Joesbury",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "721",
            "id": 50,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "joesbury@niceschool.edu"
        },
        {
            "name": "Fifine  Moret",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "249",
            "id": 78,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "moret@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Hardy Hadlee Monkhouse",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "401",
            "id": 106,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "hmonkhouse@niceschool.edu"
        },
        {
            "name": "Eberto  Cragell",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "630",
            "id": 134,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "cragell@niceschool.edu"
        },
        {
            "name": "Kiri Izabel Boffey",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "124",
            "id": 162,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "iboffey@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Linell Catriona De Biasi",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "801",
            "id": 190,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "cde biasi@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Sacha AMalee Doone",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "899",
            "id": 218,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "adoone@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Emmett Eugene Linden",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "943",
            "id": 246,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "elinden@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Lory  Sydall",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "585",
            "id": 274,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "sydall@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Hebert  Hirthe",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "697",
            "id": 302,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "hirthe@niceschool.edu"
        },
        {
            "name": "Cinderella  Birdseye",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "878",
            "id": 330,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "birdseye@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Carr Farly Glamart",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "623",
            "id": 358,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "fglamart@niceschool.edu"
        },
        {
            "name": "Almira Angela Yakebowitch",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "2",
            "id": 386,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "ayakebowitch@niceschool.edu"
        },
        {
            "name": "Jase Milton Sommerville",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "522",
            "id": 414,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "msommerville@niceschool.edu"
        },
        {
            "name": "Tammy Tremayne Lissaman",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "702",
            "id": 442,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "tlissaman@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Julie  Dolphin",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "793",
            "id": 470,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "dolphin@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Harald  Furbank",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "903",
            "id": 498,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "furbank@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Natale  Lewsey",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "609",
            "id": 526,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "lewsey@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Shurwood  Withrop",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "262",
            "id": 554,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "withrop@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Karine  Nurdin",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "282",
            "id": 582,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "nurdin@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Hinda  Turfs",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "904",
            "id": 610,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "turfs@niceschool.edu"
        },
        {
            "name": "Amandie Giorgia De Cruce",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "54",
            "id": 638,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "gde cruce@niceschool.edu"
        },
        {
            "name": "Natalee Janetta Sachno",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "6",
            "id": 666,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "jsachno@niceschool.edu"
        },
        {
            "name": "Janine  Duer",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "214",
            "id": 694,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "duer@niceschool.edu"
        },
        {
            "name": "Dugald  Pfaffe",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "822",
            "id": 722,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "pfaffe@niceschool.edu"
        },
        {
            "name": "Madelin Neila MacAlees",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "703",
            "id": 750,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "nmacalees@niceschool.edu"
        },
        {
            "name": "Nataline Florry Ridwood",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "862",
            "id": 778,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "fridwood@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Norean Lilian Paula",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "431",
            "id": 806,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "lpaula@niceschool.edu"
        },
        {
            "name": "Kimbra Willamina Nassie",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "158",
            "id": 834,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "wnassie@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Mordecai Billy MacFarlan",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "869",
            "id": 862,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "bmacfarlan@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Benson Jethro Condliffe",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "712",
            "id": 890,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "email": "jcondliffe@niceschool.edu",
            "hr_id": "G09S2"
        },
        {
            "name": "Kaleb Skell Van Hesteren",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "661",
            "id": 918,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "svan hesteren@niceschool.edu"
        },
        {
            "name": "Mina Maud Esslemont",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "678",
            "id": 946,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "messlemont@niceschool.edu"
        },
        {
            "name": "Cobbie Issiah Kirkbride",
            "level": "HS",
            "grade": "9",
            "homeroom": "Taitung",
            "student_id": "314",
            "id": 974,
            "hr_teacher_name": "Mr. Lexi Stevens",
            "hr_id": "G09S2",
            "email": "ikirkbride@niceschool.edu"
        },
        {
            "name": "Levi Torre Devenish",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "196",
            "id": 28,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "tdevenish@niceschool.edu"
        },
        {
            "name": "Warner  Ulyatt",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "284",
            "id": 56,
            "hr_teacher_name": "Dr. Ivette Cork",
            "email": "ulyatt@niceschool.edu",
            "hr_id": "G12S2"
        },
        {
            "name": "Paddy Aguie Vlasin",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "113",
            "id": 84,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "avlasin@niceschool.edu"
        },
        {
            "name": "Merill Mathian Swane",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "369",
            "id": 112,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "mswane@niceschool.edu"
        },
        {
            "name": "Desirae  Whorlow",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "897",
            "id": 140,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "whorlow@niceschool.edu"
        },
        {
            "name": "Thorvald Cassius Ertel",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "543",
            "id": 168,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "certel@niceschool.edu"
        },
        {
            "name": "Averil  Shirtcliffe",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "533",
            "id": 196,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "shirtcliffe@niceschool.edu"
        },
        {
            "name": "Jerrie  Traske",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "724",
            "id": 224,
            "hr_teacher_name": "Dr. Ivette Cork",
            "email": "traske@niceschool.edu",
            "hr_id": "G12S2"
        },
        {
            "name": "Lay Terrance Yanez",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "177",
            "id": 252,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "tyanez@niceschool.edu"
        },
        {
            "name": "Abbe Horacio Trewhela",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "925",
            "id": 280,
            "hr_teacher_name": "Dr. Ivette Cork",
            "email": "htrewhela@niceschool.edu",
            "hr_id": "G12S2"
        },
        {
            "name": "Donna  Kohn",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "409",
            "id": 308,
            "hr_teacher_name": "Dr. Ivette Cork",
            "email": "kohn@niceschool.edu",
            "hr_id": "G12S2"
        },
        {
            "name": "Sibyl Dino Churchin",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "241",
            "id": 336,
            "hr_teacher_name": "Dr. Ivette Cork",
            "email": "dchurchin@niceschool.edu",
            "hr_id": "G12S2"
        },
        {
            "name": "Dyanna Lian Tidball",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "876",
            "id": 364,
            "hr_teacher_name": "Dr. Ivette Cork",
            "email": "ltidball@niceschool.edu",
            "hr_id": "G12S2"
        },
        {
            "name": "Woodie  Finkle",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "383",
            "id": 392,
            "hr_teacher_name": "Dr. Ivette Cork",
            "email": "finkle@niceschool.edu",
            "hr_id": "G12S2"
        },
        {
            "name": "Wang Hillyer Trangmar",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "476",
            "id": 420,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "htrangmar@niceschool.edu"
        },
        {
            "name": "Gae Isahella Onslow",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "759",
            "id": 448,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "ionslow@niceschool.edu"
        },
        {
            "name": "Roseanna Cosette Beekmann",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "792",
            "id": 476,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "cbeekmann@niceschool.edu"
        },
        {
            "name": "Minda  O' Driscoll",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "396",
            "id": 504,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "o' driscoll@niceschool.edu"
        },
        {
            "name": "Cassandry Zilvia Starrs",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "191",
            "id": 532,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "zstarrs@niceschool.edu"
        },
        {
            "name": "Shandeigh Mireille Kohnen",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "493",
            "id": 560,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "mkohnen@niceschool.edu"
        },
        {
            "name": "Malory Crysta Navaro",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "264",
            "id": 588,
            "hr_teacher_name": "Dr. Ivette Cork",
            "email": "cnavaro@niceschool.edu",
            "hr_id": "G12S2"
        },
        {
            "name": "Skell  Gerald",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "842",
            "id": 616,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "gerald@niceschool.edu"
        },
        {
            "name": "Andy  Chellingworth",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "628",
            "id": 644,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "chellingworth@niceschool.edu"
        },
        {
            "name": "Kata  Comusso",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "811",
            "id": 672,
            "hr_teacher_name": "Dr. Ivette Cork",
            "email": "comusso@niceschool.edu",
            "hr_id": "G12S2"
        },
        {
            "name": "Towney Barris Filintsev",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "194",
            "id": 700,
            "hr_teacher_name": "Dr. Ivette Cork",
            "email": "bfilintsev@niceschool.edu",
            "hr_id": "G12S2"
        },
        {
            "name": "Gladi Feliza Foy",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "946",
            "id": 728,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "ffoy@niceschool.edu"
        },
        {
            "name": "Annemarie  Thames",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "625",
            "id": 756,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "thames@niceschool.edu"
        },
        {
            "name": "Derek  Milsom",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "390",
            "id": 784,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "milsom@niceschool.edu"
        },
        {
            "name": "Ame Quintana Sherel",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "213",
            "id": 812,
            "hr_teacher_name": "Dr. Ivette Cork",
            "email": "qsherel@niceschool.edu",
            "hr_id": "G12S2"
        },
        {
            "name": "Marilyn Jade Pflieger",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "921",
            "id": 840,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "jpflieger@niceschool.edu"
        },
        {
            "name": "Shandra Olivie Mannin",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "968",
            "id": 868,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "omannin@niceschool.edu"
        },
        {
            "name": "Sibby Tommi Jayes",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "730",
            "id": 896,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "tjayes@niceschool.edu"
        },
        {
            "name": "Nolly Jaimie Robottom",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "164",
            "id": 924,
            "hr_teacher_name": "Dr. Ivette Cork",
            "email": "jrobottom@niceschool.edu",
            "hr_id": "G12S2"
        },
        {
            "name": "Anders  Kidman",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "551",
            "id": 952,
            "hr_teacher_name": "Dr. Ivette Cork",
            "hr_id": "G12S2",
            "email": "kidman@niceschool.edu"
        },
        {
            "name": "Brooks Giselbert Kender",
            "level": "HS",
            "grade": "12",
            "homeroom": "Tamsui",
            "student_id": "959",
            "id": 980,
            "hr_teacher_name": "Dr. Ivette Cork",
            "email": "gkender@niceschool.edu",
            "hr_id": "G12S2"
        },
        {
            "name": "Svend  Gass",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "974",
            "id": 6,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "gass@niceschool.edu"
        },
        {
            "name": "Phillipe Chev Hebson",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "582",
            "id": 34,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "email": "chebson@niceschool.edu",
            "hr_id": "G01S2"
        },
        {
            "name": "Tucker Ambrosius McNutt",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "513",
            "id": 62,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "email": "amcnutt@niceschool.edu",
            "hr_id": "G01S2"
        },
        {
            "name": "Cindee Erinna Wanderschek",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "548",
            "id": 90,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "email": "ewanderschek@niceschool.edu",
            "hr_id": "G01S2"
        },
        {
            "name": "Holmes Troy Battershall",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "61",
            "id": 118,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "tbattershall@niceschool.edu"
        },
        {
            "name": "Jeannette Abagail Butson",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "434",
            "id": 146,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "abutson@niceschool.edu"
        },
        {
            "name": "Jenica Lynnell Brady",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "335",
            "id": 174,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "lbrady@niceschool.edu"
        },
        {
            "name": "Blakelee Birdie Buckingham",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "374",
            "id": 202,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "email": "bbuckingham@niceschool.edu",
            "hr_id": "G01S2"
        },
        {
            "name": "Yvor Brendis Winsiowiecki",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "620",
            "id": 230,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "bwinsiowiecki@niceschool.edu"
        },
        {
            "name": "Cletis Boony Donkersley",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "531",
            "id": 258,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "bdonkersley@niceschool.edu"
        },
        {
            "name": "Olia Angelle Gorling",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "604",
            "id": 286,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "agorling@niceschool.edu"
        },
        {
            "name": "Annnora Ginnie Spir",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "137",
            "id": 314,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "gspir@niceschool.edu"
        },
        {
            "name": "Coletta Alisha Worley",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "218",
            "id": 342,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "aworley@niceschool.edu"
        },
        {
            "name": "Amandy  Schustl",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "644",
            "id": 370,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "email": "schustl@niceschool.edu",
            "hr_id": "G01S2"
        },
        {
            "name": "Lanni Maggi Palfreman",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "477",
            "id": 398,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "mpalfreman@niceschool.edu"
        },
        {
            "name": "Min Gracia Creenan",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "319",
            "id": 426,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "email": "gcreenan@niceschool.edu",
            "hr_id": "G01S2"
        },
        {
            "name": "Jandy  Suttle",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "278",
            "id": 454,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "email": "suttle@niceschool.edu",
            "hr_id": "G01S2"
        },
        {
            "name": "Vernice Elwira Chern",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "937",
            "id": 482,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "email": "echern@niceschool.edu",
            "hr_id": "G01S2"
        },
        {
            "name": "Bondon  Grassick",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "148",
            "id": 510,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "grassick@niceschool.edu"
        },
        {
            "name": "Genovera Kathryn Zuan",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "824",
            "id": 538,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "email": "kzuan@niceschool.edu",
            "hr_id": "G01S2"
        },
        {
            "name": "Huntlee  Pittel",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "757",
            "id": 566,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "pittel@niceschool.edu"
        },
        {
            "name": "Massimo Lorens D'Alessio",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "417",
            "id": 594,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "ld'alessio@niceschool.edu"
        },
        {
            "name": "Jens Jacobo Maria",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "232",
            "id": 622,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "jmaria@niceschool.edu"
        },
        {
            "name": "Robbert Miles Shilton",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "970",
            "id": 650,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "mshilton@niceschool.edu"
        },
        {
            "name": "Park  Fransson",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "745",
            "id": 678,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "email": "fransson@niceschool.edu",
            "hr_id": "G01S2"
        },
        {
            "name": "Tore Aluino Sharnock",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "305",
            "id": 706,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "asharnock@niceschool.edu"
        },
        {
            "name": "Maddalena Rodi Kingcott",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "999",
            "id": 734,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "rkingcott@niceschool.edu"
        },
        {
            "name": "Errick  Philler",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "391",
            "id": 762,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "email": "philler@niceschool.edu",
            "hr_id": "G01S2"
        },
        {
            "name": "Matty Angelika Bradtke",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "443",
            "id": 790,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "email": "abradtke@niceschool.edu",
            "hr_id": "G01S2"
        },
        {
            "name": "Kathlin Tess Silburn",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "663",
            "id": 818,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "tsilburn@niceschool.edu"
        },
        {
            "name": "Norean Andree Roomes",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "948",
            "id": 846,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "aroomes@niceschool.edu"
        },
        {
            "name": "Gay  Jedrzejkiewicz",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "360",
            "id": 874,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "jedrzejkiewicz@niceschool.edu"
        },
        {
            "name": "Bidget Consolata McNirlin",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "880",
            "id": 902,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "email": "cmcnirlin@niceschool.edu",
            "hr_id": "G01S2"
        },
        {
            "name": "Vania Halli Blinkhorn",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "134",
            "id": 930,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "email": "hblinkhorn@niceschool.edu",
            "hr_id": "G01S2"
        },
        {
            "name": "Walsh Orlando Leggen",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "889",
            "id": 958,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "email": "oleggen@niceschool.edu",
            "hr_id": "G01S2"
        },
        {
            "name": "Yehudi Emerson Pyrah",
            "level": "LS",
            "grade": "1",
            "homeroom": "Taoyuan",
            "student_id": "247",
            "id": 986,
            "hr_teacher_name": "Ms. Felicity Hobson",
            "hr_id": "G01S2",
            "email": "epyrah@niceschool.edu"
        },
        {
            "name": "Briny Liana Stango",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "389",
            "id": 23,
            "hr_teacher_name": "Mr. Alan Radley",
            "hr_id": "G10S1",
            "email": "lstango@niceschool.edu"
        },
        {
            "name": "Edwin Nick Wilkowski",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "796",
            "id": 51,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "nwilkowski@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Randal Billie Ings",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "266",
            "id": 79,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "bings@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Ibrahim Eldin Gronaver",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "343",
            "id": 107,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "egronaver@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Hartwell Kaspar Bazylets",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "825",
            "id": 135,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "kbazylets@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Nessy Nanice Pothecary",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "815",
            "id": 163,
            "hr_teacher_name": "Mr. Alan Radley",
            "hr_id": "G10S1",
            "email": "npothecary@niceschool.edu"
        },
        {
            "name": "Lucho Alric Maghull",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "395",
            "id": 191,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "amaghull@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Christoforo Pryce Fearfull",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "163",
            "id": 219,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "pfearfull@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Katleen Jemima Carous",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "34",
            "id": 247,
            "hr_teacher_name": "Mr. Alan Radley",
            "hr_id": "G10S1",
            "email": "jcarous@niceschool.edu"
        },
        {
            "name": "Lorrin  Camili",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "326",
            "id": 275,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "camili@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Matilde Marnie Pavyer",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "463",
            "id": 303,
            "hr_teacher_name": "Mr. Alan Radley",
            "hr_id": "G10S1",
            "email": "mpavyer@niceschool.edu"
        },
        {
            "name": "Donal  Purser",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "51",
            "id": 331,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "purser@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Arliene Afton Dow",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "528",
            "id": 359,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "adow@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Dacie  Almond",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "804",
            "id": 387,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "almond@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Maurits Ezekiel Roseman",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "225",
            "id": 415,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "eroseman@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Gualterio Vladamir Ferrieroi",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "306",
            "id": 443,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "vferrieroi@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Brantley Jerrie Elgie",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "115",
            "id": 471,
            "hr_teacher_name": "Mr. Alan Radley",
            "hr_id": "G10S1",
            "email": "jelgie@niceschool.edu"
        },
        {
            "name": "Sib Doretta Birdwistle",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "332",
            "id": 499,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "dbirdwistle@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Cristina Mariska Apfler",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "458",
            "id": 527,
            "hr_teacher_name": "Mr. Alan Radley",
            "hr_id": "G10S1",
            "email": "mapfler@niceschool.edu"
        },
        {
            "name": "Peria  Askie",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "234",
            "id": 555,
            "hr_teacher_name": "Mr. Alan Radley",
            "hr_id": "G10S1",
            "email": "askie@niceschool.edu"
        },
        {
            "name": "Vanda Kimberley Medcalfe",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "35",
            "id": 583,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "kmedcalfe@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Lexine Otha Doberer",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "711",
            "id": 611,
            "hr_teacher_name": "Mr. Alan Radley",
            "hr_id": "G10S1",
            "email": "odoberer@niceschool.edu"
        },
        {
            "name": "Page  Ruddiman",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "511",
            "id": 639,
            "hr_teacher_name": "Mr. Alan Radley",
            "hr_id": "G10S1",
            "email": "ruddiman@niceschool.edu"
        },
        {
            "name": "Monah Latia Cocher",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "520",
            "id": 667,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "lcocher@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Mallory Petronella Crosthwaite",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "714",
            "id": 695,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "pcrosthwaite@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Maddie  Jorio",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "470",
            "id": 723,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "jorio@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Cosme Marlowe Dallewater",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "144",
            "id": 751,
            "hr_teacher_name": "Mr. Alan Radley",
            "hr_id": "G10S1",
            "email": "mdallewater@niceschool.edu"
        },
        {
            "name": "Trudy Marsha Blasl",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "541",
            "id": 779,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "mblasl@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Johann Toddy Cromar",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "913",
            "id": 807,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "tcromar@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Kameko  Craigmyle",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "844",
            "id": 835,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "craigmyle@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Hanan Arturo Carlisle",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "572",
            "id": 863,
            "hr_teacher_name": "Mr. Alan Radley",
            "hr_id": "G10S1",
            "email": "acarlisle@niceschool.edu"
        },
        {
            "name": "Mario  Croad",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "564",
            "id": 891,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "croad@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Alice Berna Swansbury",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "135",
            "id": 919,
            "hr_teacher_name": "Mr. Alan Radley",
            "hr_id": "G10S1",
            "email": "bswansbury@niceschool.edu"
        },
        {
            "name": "Aron Donaugh Fillingham",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "442",
            "id": 947,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "dfillingham@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Hugibert Thacher Payne",
            "level": "HS",
            "grade": "10",
            "homeroom": "Toufen",
            "student_id": "408",
            "id": 975,
            "hr_teacher_name": "Mr. Alan Radley",
            "email": "tpayne@niceschool.edu",
            "hr_id": "G10S1"
        },
        {
            "name": "Maryellen Valentine Guitt",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "338",
            "id": 2,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "vguitt@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Dorise  Redmond",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "259",
            "id": 30,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "redmond@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Blancha Valencia Trineman",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "975",
            "id": 58,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "vtrineman@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Joshia  Butlin",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "64",
            "id": 86,
            "hr_teacher_name": "Mr. Danny Baker",
            "hr_id": "GPKS2",
            "email": "butlin@niceschool.edu"
        },
        {
            "name": "Trina Farand Kippling",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "402",
            "id": 114,
            "hr_teacher_name": "Mr. Danny Baker",
            "hr_id": "GPKS2",
            "email": "fkippling@niceschool.edu"
        },
        {
            "name": "Sabine Micky Janecek",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "761",
            "id": 142,
            "hr_teacher_name": "Mr. Danny Baker",
            "hr_id": "GPKS2",
            "email": "mjanecek@niceschool.edu"
        },
        {
            "name": "Berkly Carl Nizet",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "612",
            "id": 170,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "cnizet@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Helen Hedy Bavage",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "696",
            "id": 198,
            "hr_teacher_name": "Mr. Danny Baker",
            "hr_id": "GPKS2",
            "email": "hbavage@niceschool.edu"
        },
        {
            "name": "Fay  Micklem",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "364",
            "id": 226,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "micklem@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Barri Lorant Thowless",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "960",
            "id": 254,
            "hr_teacher_name": "Mr. Danny Baker",
            "hr_id": "GPKS2",
            "email": "lthowless@niceschool.edu"
        },
        {
            "name": "Saunders Wake Jeffry",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "351",
            "id": 282,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "wjeffry@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Elianora Nichol Castille",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "146",
            "id": 310,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "ncastille@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Malchy  Oddboy",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "575",
            "id": 338,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "oddboy@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Darrelle Connie Brislen",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "691",
            "id": 366,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "cbrislen@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Kip Marji Ramsbotham",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "347",
            "id": 394,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "mramsbotham@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Elsy  Ewington",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "145",
            "id": 422,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "ewington@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Shandra Mil Deddum",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "509",
            "id": 450,
            "hr_teacher_name": "Mr. Danny Baker",
            "hr_id": "GPKS2",
            "email": "mdeddum@niceschool.edu"
        },
        {
            "name": "Sindee  Ambresin",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "147",
            "id": 478,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "ambresin@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Marita Jerrylee Elderfield",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "78",
            "id": 506,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "jelderfield@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Abbe Heather De Cristofalo",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "240",
            "id": 534,
            "hr_teacher_name": "Mr. Danny Baker",
            "hr_id": "GPKS2",
            "email": "hde cristofalo@niceschool.edu"
        },
        {
            "name": "Eryn Estrellita Machon",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "49",
            "id": 562,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "emachon@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Pen Antonia Caret",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "224",
            "id": 590,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "acaret@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Arney Fair Kubacki",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "722",
            "id": 618,
            "hr_teacher_name": "Mr. Danny Baker",
            "hr_id": "GPKS2",
            "email": "fkubacki@niceschool.edu"
        },
        {
            "name": "Sabine Roselle Dennidge",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "740",
            "id": 646,
            "hr_teacher_name": "Mr. Danny Baker",
            "hr_id": "GPKS2",
            "email": "rdennidge@niceschool.edu"
        },
        {
            "name": "Winonah Maggie McAmish",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "393",
            "id": 674,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "mmcamish@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Darla Katharina Cropton",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "867",
            "id": 702,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "kcropton@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Tadd  Golightly",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "643",
            "id": 730,
            "hr_teacher_name": "Mr. Danny Baker",
            "hr_id": "GPKS2",
            "email": "golightly@niceschool.edu"
        },
        {
            "name": "Janaya Kailey Beneze",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "151",
            "id": 758,
            "hr_teacher_name": "Mr. Danny Baker",
            "hr_id": "GPKS2",
            "email": "kbeneze@niceschool.edu"
        },
        {
            "name": "Quentin Von Germon",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "433",
            "id": 786,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "vgermon@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Shelley  Whellams",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "931",
            "id": 814,
            "hr_teacher_name": "Mr. Danny Baker",
            "hr_id": "GPKS2",
            "email": "whellams@niceschool.edu"
        },
        {
            "name": "Shanie Melisandra Cotes",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "540",
            "id": 842,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "mcotes@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Mervin Franklin Greensmith",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "579",
            "id": 870,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "fgreensmith@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Karoly Kandy Martel",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "606",
            "id": 898,
            "hr_teacher_name": "Mr. Danny Baker",
            "hr_id": "GPKS2",
            "email": "kmartel@niceschool.edu"
        },
        {
            "name": "Lorelle Deane De Hooch",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "114",
            "id": 926,
            "hr_teacher_name": "Mr. Danny Baker",
            "email": "dde hooch@niceschool.edu",
            "hr_id": "GPKS2"
        },
        {
            "name": "Angie Andie Huortic",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "307",
            "id": 954,
            "hr_teacher_name": "Mr. Danny Baker",
            "hr_id": "GPKS2",
            "email": "ahuortic@niceschool.edu"
        },
        {
            "name": "Lidia Chad Huguenet",
            "level": "LS",
            "grade": "PK",
            "homeroom": "Wulai",
            "student_id": "648",
            "id": 982,
            "hr_teacher_name": "Mr. Danny Baker",
            "hr_id": "GPKS2",
            "email": "chuguenet@niceschool.edu"
        },
        {
            "name": "Mort Ferdy Carmel",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "535",
            "id": 24,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "fcarmel@niceschool.edu"
        },
        {
            "name": "William  Rawet",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "503",
            "id": 52,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "rawet@niceschool.edu"
        },
        {
            "name": "Hermine  Ingree",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "621",
            "id": 80,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "ingree@niceschool.edu"
        },
        {
            "name": "Vinni  Leagas",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "47",
            "id": 108,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "leagas@niceschool.edu"
        },
        {
            "name": "Gerick  Bergeau",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "308",
            "id": 136,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "email": "bergeau@niceschool.edu",
            "hr_id": "G10S2"
        },
        {
            "name": "Xavier Alisander Birley",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "517",
            "id": 164,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "email": "abirley@niceschool.edu",
            "hr_id": "G10S2"
        },
        {
            "name": "Lindsey  Osband",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "914",
            "id": 192,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "email": "osband@niceschool.edu",
            "hr_id": "G10S2"
        },
        {
            "name": "Karoline Carita Martensen",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "674",
            "id": 220,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "cmartensen@niceschool.edu"
        },
        {
            "name": "Killian  Monson",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "909",
            "id": 248,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "monson@niceschool.edu"
        },
        {
            "name": "Berni Nonah Spreckley",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "512",
            "id": 276,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "email": "nspreckley@niceschool.edu",
            "hr_id": "G10S2"
        },
        {
            "name": "Karlotta  Buckmaster",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "209",
            "id": 304,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "email": "buckmaster@niceschool.edu",
            "hr_id": "G10S2"
        },
        {
            "name": "Ilka Austin Challinor",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "341",
            "id": 332,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "email": "achallinor@niceschool.edu",
            "hr_id": "G10S2"
        },
        {
            "name": "Benedict Elbert Pasterfield",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "581",
            "id": 360,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "epasterfield@niceschool.edu"
        },
        {
            "name": "John Bank Dossetter",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "765",
            "id": 388,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "bdossetter@niceschool.edu"
        },
        {
            "name": "Shelden Amos Kemster",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "466",
            "id": 416,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "akemster@niceschool.edu"
        },
        {
            "name": "Jerry Manuel Kingman",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "634",
            "id": 444,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "email": "mkingman@niceschool.edu",
            "hr_id": "G10S2"
        },
        {
            "name": "Edithe Allys Leggan",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "427",
            "id": 472,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "email": "aleggan@niceschool.edu",
            "hr_id": "G10S2"
        },
        {
            "name": "Rob Tailor Springell",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "215",
            "id": 500,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "email": "tspringell@niceschool.edu",
            "hr_id": "G10S2"
        },
        {
            "name": "Grier Deana Harder",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "929",
            "id": 528,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "email": "dharder@niceschool.edu",
            "hr_id": "G10S2"
        },
        {
            "name": "Ruggiero Christoforo Hazelhurst",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "977",
            "id": 556,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "chazelhurst@niceschool.edu"
        },
        {
            "name": "Fremont Hillier Maccaig",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "32",
            "id": 584,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "hmaccaig@niceschool.edu"
        },
        {
            "name": "Dannel Penrod Alabaster",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "817",
            "id": 612,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "palabaster@niceschool.edu"
        },
        {
            "name": "Stacee Chuck Edmeades",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "432",
            "id": 640,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "email": "cedmeades@niceschool.edu",
            "hr_id": "G10S2"
        },
        {
            "name": "Shandee Zabrina Risdall",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "593",
            "id": 668,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "email": "zrisdall@niceschool.edu",
            "hr_id": "G10S2"
        },
        {
            "name": "Carolina Molly Lemon",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "594",
            "id": 696,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "email": "mlemon@niceschool.edu",
            "hr_id": "G10S2"
        },
        {
            "name": "Francyne  Bracher",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "671",
            "id": 724,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "email": "bracher@niceschool.edu",
            "hr_id": "G10S2"
        },
        {
            "name": "Johnathon Linoel Dacey",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "286",
            "id": 752,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "ldacey@niceschool.edu"
        },
        {
            "name": "Jobye  Gavrieli",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "7",
            "id": 780,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "gavrieli@niceschool.edu"
        },
        {
            "name": "Karalynn Carrissa Roll",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "333",
            "id": 808,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "email": "croll@niceschool.edu",
            "hr_id": "G10S2"
        },
        {
            "name": "Yalonda Neysa Simmens",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "829",
            "id": 836,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "email": "nsimmens@niceschool.edu",
            "hr_id": "G10S2"
        },
        {
            "name": "Chrotoem  Cockett",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "479",
            "id": 864,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "cockett@niceschool.edu"
        },
        {
            "name": "Lurlene  Sanches",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "226",
            "id": 892,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "sanches@niceschool.edu"
        },
        {
            "name": "Felix Kaiser Erbe",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "890",
            "id": 920,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "kerbe@niceschool.edu"
        },
        {
            "name": "Tracie  Daly",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "366",
            "id": 948,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "daly@niceschool.edu"
        },
        {
            "name": "Claire Masha Taylour",
            "level": "HS",
            "grade": "10",
            "homeroom": "Yilan",
            "student_id": "982",
            "id": 976,
            "hr_teacher_name": "Ms. Lorraine Franks",
            "hr_id": "G10S2",
            "email": "mtaylour@niceschool.edu"
        },
        {
            "name": "Ferne Netti Gooding",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "962",
            "id": 25,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "ngooding@niceschool.edu"
        },
        {
            "name": "Lexie Betti Palmby",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "92",
            "id": 53,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "email": "bpalmby@niceschool.edu",
            "hr_id": "G11S1"
        },
        {
            "name": "Sloan  Bernadzki",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "16",
            "id": 81,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "email": "bernadzki@niceschool.edu",
            "hr_id": "G11S1"
        },
        {
            "name": "Twila  Rangell",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "941",
            "id": 109,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "rangell@niceschool.edu"
        },
        {
            "name": "Karita Kirsteni Ehlerding",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "896",
            "id": 137,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "kehlerding@niceschool.edu"
        },
        {
            "name": "Daloris  Mullane",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "86",
            "id": 165,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "mullane@niceschool.edu"
        },
        {
            "name": "Ardra Carri Linforth",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "462",
            "id": 193,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "email": "clinforth@niceschool.edu",
            "hr_id": "G11S1"
        },
        {
            "name": "Reed Barclay Gianelli",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "608",
            "id": 221,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "email": "bgianelli@niceschool.edu",
            "hr_id": "G11S1"
        },
        {
            "name": "Elvera Emili Lyddy",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "253",
            "id": 249,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "elyddy@niceschool.edu"
        },
        {
            "name": "Erda Celestyna Yendall",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "917",
            "id": 277,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "cyendall@niceschool.edu"
        },
        {
            "name": "Brucie Dunstan Campa",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "73",
            "id": 305,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "email": "dcampa@niceschool.edu",
            "hr_id": "G11S1"
        },
        {
            "name": "Maggie  Diver",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "313",
            "id": 333,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "diver@niceschool.edu"
        },
        {
            "name": "Krispin Mal Matley",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "601",
            "id": 361,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "mmatley@niceschool.edu"
        },
        {
            "name": "Maynord Dallon Simoneton",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "930",
            "id": 389,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "dsimoneton@niceschool.edu"
        },
        {
            "name": "Blair Saleem De Francesco",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "336",
            "id": 417,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "sde francesco@niceschool.edu"
        },
        {
            "name": "Asa Gage Paintain",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "717",
            "id": 445,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "gpaintain@niceschool.edu"
        },
        {
            "name": "Brigida Theresa Belch",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "174",
            "id": 473,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "tbelch@niceschool.edu"
        },
        {
            "name": "Joli Orsola Hunter",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "455",
            "id": 501,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "email": "ohunter@niceschool.edu",
            "hr_id": "G11S1"
        },
        {
            "name": "Anatol Wittie Persence",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "778",
            "id": 529,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "wpersence@niceschool.edu"
        },
        {
            "name": "Conn Cordell Lonergan",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "171",
            "id": 557,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "clonergan@niceschool.edu"
        },
        {
            "name": "Letti Cate Armatage",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "808",
            "id": 585,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "email": "carmatage@niceschool.edu",
            "hr_id": "G11S1"
        },
        {
            "name": "Lew Zebadiah Coppledike",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "378",
            "id": 613,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "email": "zcoppledike@niceschool.edu",
            "hr_id": "G11S1"
        },
        {
            "name": "Gunar Jone Ledford",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "763",
            "id": 641,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "email": "jledford@niceschool.edu",
            "hr_id": "G11S1"
        },
        {
            "name": "Pinchas Sidnee Mosco",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "495",
            "id": 669,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "email": "smosco@niceschool.edu",
            "hr_id": "G11S1"
        },
        {
            "name": "Madison Cross Maude",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "790",
            "id": 697,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "cmaude@niceschool.edu"
        },
        {
            "name": "Laney  Simkovitz",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "865",
            "id": 725,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "simkovitz@niceschool.edu"
        },
        {
            "name": "Orville Donall Spendlove",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "602",
            "id": 753,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "dspendlove@niceschool.edu"
        },
        {
            "name": "Lawry Pepito Boycott",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "254",
            "id": 781,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "pboycott@niceschool.edu"
        },
        {
            "name": "Emily Flss Bythell",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "287",
            "id": 809,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "fbythell@niceschool.edu"
        },
        {
            "name": "Sax Allayne Doorly",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "995",
            "id": 837,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "email": "adoorly@niceschool.edu",
            "hr_id": "G11S1"
        },
        {
            "name": "Julissa Ginevra Leathes",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "810",
            "id": 865,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "gleathes@niceschool.edu"
        },
        {
            "name": "Boone Leighton Hessing",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "860",
            "id": 893,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "hr_id": "G11S1",
            "email": "lhessing@niceschool.edu"
        },
        {
            "name": "Angil Darb Norheny",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "119",
            "id": 921,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "email": "dnorheny@niceschool.edu",
            "hr_id": "G11S1"
        },
        {
            "name": "Adey Fern Simecek",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "279",
            "id": 949,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "email": "fsimecek@niceschool.edu",
            "hr_id": "G11S1"
        },
        {
            "name": "Janka Carin Vallack",
            "level": "HS",
            "grade": "11",
            "homeroom": "Yuanlin",
            "student_id": "498",
            "id": 977,
            "hr_teacher_name": "Ms. Bernadette Moss",
            "email": "cvallack@niceschool.edu",
            "hr_id": "G11S1"
        },
        {
            "name": "Dusty  Buttle",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "732",
            "id": 26,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "buttle@niceschool.edu"
        },
        {
            "name": "Padraic Sayer Alker",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "783",
            "id": 54,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "salker@niceschool.edu"
        },
        {
            "name": "Johna Sayre Lawlance",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "149",
            "id": 82,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "slawlance@niceschool.edu"
        },
        {
            "name": "Law Rickey Taudevin",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "752",
            "id": 110,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "rtaudevin@niceschool.edu"
        },
        {
            "name": "Ladonna Joyce Burndred",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "923",
            "id": 138,
            "hr_teacher_name": "Mr. Anais Paterson",
            "email": "jburndred@niceschool.edu",
            "hr_id": "G11S2"
        },
        {
            "name": "Stormie Caralie Doyle",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "866",
            "id": 166,
            "hr_teacher_name": "Mr. Anais Paterson",
            "email": "cdoyle@niceschool.edu",
            "hr_id": "G11S2"
        },
        {
            "name": "Fredra  Cadle",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "359",
            "id": 194,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "cadle@niceschool.edu"
        },
        {
            "name": "Guenna  Jean",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "821",
            "id": 222,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "jean@niceschool.edu"
        },
        {
            "name": "Johann Chauncey Woolford",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "885",
            "id": 250,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "cwoolford@niceschool.edu"
        },
        {
            "name": "Ingemar Cyrillus Selbach",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "969",
            "id": 278,
            "hr_teacher_name": "Mr. Anais Paterson",
            "email": "cselbach@niceschool.edu",
            "hr_id": "G11S2"
        },
        {
            "name": "Rogers Griffin Broadfoot",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "840",
            "id": 306,
            "hr_teacher_name": "Mr. Anais Paterson",
            "email": "gbroadfoot@niceschool.edu",
            "hr_id": "G11S2"
        },
        {
            "name": "Gilly Analise Hawtry",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "534",
            "id": 334,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "ahawtry@niceschool.edu"
        },
        {
            "name": "Kylen Evangeline Clampe",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "125",
            "id": 362,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "eclampe@niceschool.edu"
        },
        {
            "name": "Luciana Susie Tiddy",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "912",
            "id": 390,
            "hr_teacher_name": "Mr. Anais Paterson",
            "email": "stiddy@niceschool.edu",
            "hr_id": "G11S2"
        },
        {
            "name": "Janella Deerdre Howship",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "425",
            "id": 418,
            "hr_teacher_name": "Mr. Anais Paterson",
            "email": "dhowship@niceschool.edu",
            "hr_id": "G11S2"
        },
        {
            "name": "Carmella Etheline Farlambe",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "699",
            "id": 446,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "efarlambe@niceschool.edu"
        },
        {
            "name": "Derby Gram Chavez",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "734",
            "id": 474,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "gchavez@niceschool.edu"
        },
        {
            "name": "Sandy  Bradley",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "652",
            "id": 502,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "bradley@niceschool.edu"
        },
        {
            "name": "Garth Symon Vsanelli",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "252",
            "id": 530,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "svsanelli@niceschool.edu"
        },
        {
            "name": "Odetta Malissia McIlharga",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "89",
            "id": 558,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "mmcilharga@niceschool.edu"
        },
        {
            "name": "Brnaby Enrique Burle",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "820",
            "id": 586,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "eburle@niceschool.edu"
        },
        {
            "name": "Lindy Beau Grissett",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "589",
            "id": 614,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "bgrissett@niceschool.edu"
        },
        {
            "name": "Jacki Mirella Stuke",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "441",
            "id": 642,
            "hr_teacher_name": "Mr. Anais Paterson",
            "email": "mstuke@niceschool.edu",
            "hr_id": "G11S2"
        },
        {
            "name": "Terrance Uriel Nutten",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "750",
            "id": 670,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "unutten@niceschool.edu"
        },
        {
            "name": "Trix Brandea Matten",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "789",
            "id": 698,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "bmatten@niceschool.edu"
        },
        {
            "name": "Giacinta Matelda Game",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "363",
            "id": 726,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "mgame@niceschool.edu"
        },
        {
            "name": "Devora Aigneis Burnhill",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "546",
            "id": 754,
            "hr_teacher_name": "Mr. Anais Paterson",
            "email": "aburnhill@niceschool.edu",
            "hr_id": "G11S2"
        },
        {
            "name": "Prue  Eddowes",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "346",
            "id": 782,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "eddowes@niceschool.edu"
        },
        {
            "name": "Eleni Anne Sockell",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "910",
            "id": 810,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "asockell@niceschool.edu"
        },
        {
            "name": "Esme Alonso Ilewicz",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "597",
            "id": 838,
            "hr_teacher_name": "Mr. Anais Paterson",
            "email": "ailewicz@niceschool.edu",
            "hr_id": "G11S2"
        },
        {
            "name": "Pryce Rutherford Dyball",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "106",
            "id": 866,
            "hr_teacher_name": "Mr. Anais Paterson",
            "email": "rdyball@niceschool.edu",
            "hr_id": "G11S2"
        },
        {
            "name": "Dirk Thurstan Broadnicke",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "204",
            "id": 894,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "tbroadnicke@niceschool.edu"
        },
        {
            "name": "Averyl Clarie McKibbin",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "202",
            "id": 922,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "cmckibbin@niceschool.edu"
        },
        {
            "name": "Talbot Gaston Adcocks",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "223",
            "id": 950,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "gadcocks@niceschool.edu"
        },
        {
            "name": "Adelbert Benedikt Ashlee",
            "level": "HS",
            "grade": "11",
            "homeroom": "Zhubei",
            "student_id": "700",
            "id": 978,
            "hr_teacher_name": "Mr. Anais Paterson",
            "hr_id": "G11S2",
            "email": "bashlee@niceschool.edu"
        }
    ];

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function quintOut(t) {
        return --t * t * t * t * t + 1;
    }

    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* src/routes/Merit.svelte generated by Svelte v3.44.3 */

    const { console: console_1 } = globals;
    const file$3 = "src/routes/Merit.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[38] = list[i];
    	return child_ctx;
    }

    // (160:8) {#each homerooms as homeroom}
    function create_each_block_4(ctx) {
    	let option;
    	let t_value = /*homeroom*/ ctx[38] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*homeroom*/ ctx[38];
    			option.value = option.__value;
    			add_location(option, file$3, 160, 10, 5525);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*homerooms*/ 32 && t_value !== (t_value = /*homeroom*/ ctx[38] + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*homerooms*/ 32 && option_value_value !== (option_value_value = /*homeroom*/ ctx[38])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(160:8) {#each homerooms as homeroom}",
    		ctx
    	});

    	return block;
    }

    // (185:8) {#each filteredStudents as student}
    function create_each_block_3(ctx) {
    	let option;
    	let t_value = /*student*/ ctx[33].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*student*/ ctx[33];
    			option.value = option.__value;
    			add_location(option, file$3, 185, 10, 6655);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*filteredStudents*/ 16 && t_value !== (t_value = /*student*/ ctx[33].name + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*filteredStudents*/ 16 && option_value_value !== (option_value_value = /*student*/ ctx[33])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(185:8) {#each filteredStudents as student}",
    		ctx
    	});

    	return block;
    }

    // (203:6) {:else}
    function create_else_block_1(ctx) {
    	let select;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*selectedStudents*/ ctx[8];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(select, "class", "mt-1 rounded-md h-32 w-full shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50");
    			attr_dev(select, "name", "addedStudents");
    			attr_dev(select, "id", "addedStudents");
    			select.multiple = true;
    			if (/*studentsToRemoveFromList*/ ctx[10] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[19].call(select));
    			add_location(select, file$3, 203, 8, 7552);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_options(select, /*studentsToRemoveFromList*/ ctx[10]);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*select_change_handler*/ ctx[19]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*selectedStudents*/ 256) {
    				each_value_2 = /*selectedStudents*/ ctx[8];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}

    			if (dirty[0] & /*studentsToRemoveFromList, selectedStudents*/ 1280) {
    				select_options(select, /*studentsToRemoveFromList*/ ctx[10]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(203:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (201:6) {#if selectedStudents.length < 1}
    function create_if_block_2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Please select a student";
    			attr_dev(p, "class", "text-red-500 text-xs italic");
    			add_location(p, file$3, 201, 8, 7463);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(201:6) {#if selectedStudents.length < 1}",
    		ctx
    	});

    	return block;
    }

    // (211:10) {#each selectedStudents as student}
    function create_each_block_2(ctx) {
    	let option;
    	let t0_value = /*student*/ ctx[33].id + "";
    	let t0;
    	let t1;
    	let t2_value = /*student*/ ctx[33].name + "";
    	let t2;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = text(": ");
    			t2 = text(t2_value);
    			option.__value = option_value_value = /*student*/ ctx[33];
    			option.value = option.__value;
    			add_location(option, file$3, 211, 12, 7890);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    			append_dev(option, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*selectedStudents*/ 256 && t0_value !== (t0_value = /*student*/ ctx[33].id + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*selectedStudents*/ 256 && t2_value !== (t2_value = /*student*/ ctx[33].name + "")) set_data_dev(t2, t2_value);

    			if (dirty[0] & /*selectedStudents*/ 256 && option_value_value !== (option_value_value = /*student*/ ctx[33])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(211:10) {#each selectedStudents as student}",
    		ctx
    	});

    	return block;
    }

    // (221:8) {#each behaviorCategories as category}
    function create_each_block_1(ctx) {
    	let p;
    	let input;
    	let t0;
    	let label;
    	let t1_value = /*category*/ ctx[28] + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "radio");
    			attr_dev(input, "name", behaviorCategories);
    			attr_dev(input, "id", /*category*/ ctx[28]);
    			input.__value = /*category*/ ctx[28];
    			input.value = input.__value;
    			/*$$binding_groups*/ ctx[21][1].push(input);
    			add_location(input, file$3, 222, 12, 8292);
    			attr_dev(label, "for", /*category*/ ctx[28]);
    			add_location(label, file$3, 230, 12, 8529);
    			attr_dev(p, "class", "mb-2");
    			add_location(p, file$3, 221, 10, 8263);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, input);
    			input.checked = input.__value === /*level*/ ctx[2];
    			append_dev(p, t0);
    			append_dev(p, label);
    			append_dev(label, t1);
    			append_dev(p, t2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[20]),
    					listen_dev(input, "change", /*displayCategories*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*level*/ 4) {
    				input.checked = input.__value === /*level*/ ctx[2];
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			/*$$binding_groups*/ ctx[21][1].splice(/*$$binding_groups*/ ctx[21][1].indexOf(input), 1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(221:8) {#each behaviorCategories as category}",
    		ctx
    	});

    	return block;
    }

    // (235:6) {#if !level}
    function create_if_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Select a Merit category from the list.";
    			attr_dev(p, "class", "text-red-500 text-xs italic");
    			add_location(p, file$3, 235, 8, 8646);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(235:6) {#if !level}",
    		ctx
    	});

    	return block;
    }

    // (261:8) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Please select a Merit category from the list.";
    			attr_dev(p, "class", "text-red-500 text-xs italic");
    			add_location(p, file$3, 261, 10, 9626);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(261:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (242:8) {#if categories.length > 0}
    function create_if_block(ctx) {
    	let ul;
    	let current;
    	let each_value = /*categories*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "p-2 mx-auto");
    			add_location(ul, file$3, 242, 10, 8918);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*categories, behaviorList*/ 192) {
    				each_value = /*categories*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(242:8) {#if categories.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (244:12) {#each categories as category}
    function create_each_block(ctx) {
    	let li;
    	let input;
    	let input_id_value;
    	let input_value_value;
    	let t0;
    	let label;
    	let t1_value = /*category*/ ctx[28] + "";
    	let t1;
    	let label_for_value;
    	let t2;
    	let li_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "text-blue-500 border-2 rounded border-blue-500 focus:ring-blue-500");
    			attr_dev(input, "id", input_id_value = /*category*/ ctx[28]);
    			attr_dev(input, "name", "behaviorList");
    			input.__value = input_value_value = /*category*/ ctx[28];
    			input.value = input.__value;
    			/*$$binding_groups*/ ctx[21][0].push(input);
    			add_location(input, file$3, 248, 16, 9159);
    			attr_dev(label, "for", label_for_value = /*category*/ ctx[28]);
    			attr_dev(label, "class", "ml-2 py-1 text-sm");
    			add_location(label, file$3, 256, 16, 9477);
    			attr_dev(li, "class", "pt-2 pb-1");
    			add_location(li, file$3, 244, 14, 9000);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, input);
    			input.checked = ~/*behaviorList*/ ctx[7].indexOf(input.__value);
    			append_dev(li, t0);
    			append_dev(li, label);
    			append_dev(label, t1);
    			append_dev(li, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler_1*/ ctx[22]);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty[0] & /*categories*/ 64 && input_id_value !== (input_id_value = /*category*/ ctx[28])) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (!current || dirty[0] & /*categories*/ 64 && input_value_value !== (input_value_value = /*category*/ ctx[28])) {
    				prop_dev(input, "__value", input_value_value);
    				input.value = input.__value;
    			}

    			if (dirty[0] & /*behaviorList*/ 128) {
    				input.checked = ~/*behaviorList*/ ctx[7].indexOf(input.__value);
    			}

    			if ((!current || dirty[0] & /*categories*/ 64) && t1_value !== (t1_value = /*category*/ ctx[28] + "")) set_data_dev(t1, t1_value);

    			if (!current || dirty[0] & /*categories*/ 64 && label_for_value !== (label_for_value = /*category*/ ctx[28])) {
    				attr_dev(label, "for", label_for_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			if (local) {
    				add_render_callback(() => {
    					if (!li_transition) li_transition = create_bidirectional_transition(
    						li,
    						slide,
    						{
    							delay: 250,
    							duration: 300,
    							easing: quintOut
    						},
    						true
    					);

    					li_transition.run(1);
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			if (local) {
    				if (!li_transition) li_transition = create_bidirectional_transition(
    					li,
    					slide,
    					{
    						delay: 250,
    						duration: 300,
    						easing: quintOut
    					},
    					false
    				);

    				li_transition.run(0);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			/*$$binding_groups*/ ctx[21][0].splice(/*$$binding_groups*/ ctx[21][0].indexOf(input), 1);
    			if (detaching && li_transition) li_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(244:12) {#each categories as category}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let p0;
    	let t1;
    	let h1;
    	let t3;
    	let form;
    	let div10;
    	let div0;
    	let legend0;
    	let t5;
    	let input;
    	let t6;
    	let div1;
    	let legend1;
    	let t8;
    	let select0;
    	let option0;
    	let option1;
    	let t11;
    	let div3;
    	let div2;
    	let legend2;
    	let t13;
    	let button0;
    	let t15;
    	let p1;
    	let t17;
    	let select1;
    	let t18;
    	let div5;
    	let div4;
    	let legend3;
    	let t20;
    	let button1;
    	let t22;
    	let t23;
    	let div6;
    	let legend4;
    	let t25;
    	let fieldset0;
    	let t26;
    	let t27;
    	let div7;
    	let legend5;
    	let t29;
    	let fieldset1;
    	let current_block_type_index;
    	let if_block2;
    	let t30;
    	let div8;
    	let label;
    	let t32;
    	let textarea;
    	let t33;
    	let div9;
    	let button2;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_4 = /*homerooms*/ ctx[5];
    	validate_each_argument(each_value_4);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_2[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	let each_value_3 = /*filteredStudents*/ ctx[4];
    	validate_each_argument(each_value_3);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	function select_block_type(ctx, dirty) {
    		if (/*selectedStudents*/ ctx[8].length < 1) return create_if_block_2;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let each_value_1 = behaviorCategories;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block1 = !/*level*/ ctx[2] && create_if_block_1(ctx);
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*categories*/ ctx[6].length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "This form contains mock data";
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "Student Merit Form";
    			t3 = space();
    			form = element("form");
    			div10 = element("div");
    			div0 = element("div");
    			legend0 = element("legend");
    			legend0.textContent = "Search by Student";
    			t5 = space();
    			input = element("input");
    			t6 = space();
    			div1 = element("div");
    			legend1 = element("legend");
    			legend1.textContent = "Search by Homeroom";
    			t8 = space();
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Select a homeroom.";
    			option1 = element("option");
    			option1.textContent = "All homerooms";

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t11 = space();
    			div3 = element("div");
    			div2 = element("div");
    			legend2 = element("legend");
    			legend2.textContent = "Students";
    			t13 = space();
    			button0 = element("button");
    			button0.textContent = "Add Student";
    			t15 = space();
    			p1 = element("p");
    			p1.textContent = "Please select a student";
    			t17 = space();
    			select1 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t18 = space();
    			div5 = element("div");
    			div4 = element("div");
    			legend3 = element("legend");
    			legend3.textContent = "Selected Students";
    			t20 = space();
    			button1 = element("button");
    			button1.textContent = "Remove Student";
    			t22 = space();
    			if_block0.c();
    			t23 = space();
    			div6 = element("div");
    			legend4 = element("legend");
    			legend4.textContent = "Merit Categories";
    			t25 = space();
    			fieldset0 = element("fieldset");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t26 = space();
    			if (if_block1) if_block1.c();
    			t27 = space();
    			div7 = element("div");
    			legend5 = element("legend");
    			legend5.textContent = "Merit Information";
    			t29 = space();
    			fieldset1 = element("fieldset");
    			if_block2.c();
    			t30 = space();
    			div8 = element("div");
    			label = element("label");
    			label.textContent = "Details";
    			t32 = space();
    			textarea = element("textarea");
    			t33 = space();
    			div9 = element("div");
    			button2 = element("button");
    			button2.textContent = "Submit";
    			add_location(p0, file$3, 131, 0, 4243);
    			attr_dev(h1, "class", "text-2xl text-blue-800");
    			add_location(h1, file$3, 132, 0, 4279);
    			attr_dev(legend0, "class", "text-xl text-blue-800");
    			add_location(legend0, file$3, 138, 6, 4552);
    			attr_dev(input, "class", "mt-1 w-full mr-6 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "search-field");
    			attr_dev(input, "placeholder", "Enter Student Name");
    			attr_dev(input, "autocomplete", "off");
    			add_location(input, file$3, 139, 6, 4623);
    			attr_dev(div0, "class", "p-4 shadow-lg rounded-lg");
    			add_location(div0, file$3, 137, 4, 4507);
    			attr_dev(legend1, "class", "text-xl text-blue-800");
    			add_location(legend1, file$3, 150, 6, 5028);
    			option0.disabled = true;
    			option0.selected = true;
    			option0.__value = "";
    			option0.value = option0.__value;
    			add_location(option0, file$3, 157, 8, 5353);
    			option1.__value = "All Homerooms";
    			option1.value = option1.__value;
    			add_location(option1, file$3, 158, 8, 5424);
    			attr_dev(select0, "class", "mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50");
    			attr_dev(select0, "name", "homeroom");
    			attr_dev(select0, "id", "homeroom");
    			if (/*selectedHomeroom*/ ctx[1] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[17].call(select0));
    			add_location(select0, file$3, 151, 6, 5101);
    			attr_dev(div1, "class", "p-4 shadow-lg rounded-lg");
    			add_location(div1, file$3, 149, 4, 4983);
    			attr_dev(legend2, "class", "text-xl text-blue-800");
    			add_location(legend2, file$3, 168, 8, 5762);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "inline-block mb-2 px-4 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out");
    			add_location(button0, file$3, 169, 8, 5827);
    			attr_dev(div2, "class", "flex justify-between");
    			add_location(div2, file$3, 167, 6, 5719);
    			attr_dev(p1, "class", "text-red-500 text-xs italic");
    			add_location(p1, file$3, 176, 6, 6262);
    			attr_dev(select1, "class", "mt-1 rounded-md h-32 w-full border-none shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50");
    			attr_dev(select1, "name", "students");
    			attr_dev(select1, "id", "students");
    			select1.multiple = true;
    			if (/*studentsToAddToList*/ ctx[9] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[18].call(select1));
    			add_location(select1, file$3, 177, 6, 6335);
    			attr_dev(div3, "class", "p-4 shadow-lg rounded-lg");
    			add_location(div3, file$3, 166, 4, 5674);
    			attr_dev(legend3, "class", "text-xl text-blue-800");
    			add_location(legend3, file$3, 192, 8, 6905);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "inline-block mb-2 px-4 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out");
    			add_location(button1, file$3, 193, 8, 6978);
    			attr_dev(div4, "class", "flex justify-between");
    			add_location(div4, file$3, 191, 6, 6862);
    			attr_dev(div5, "class", "p-4 shadow-lg rounded-lg");
    			add_location(div5, file$3, 190, 4, 6817);
    			attr_dev(legend4, "class", "text-xl text-blue-800");
    			add_location(legend4, file$3, 218, 6, 8125);
    			add_location(fieldset0, file$3, 219, 6, 8195);
    			attr_dev(div6, "class", "p-4 shadow-lg rounded-lg");
    			add_location(div6, file$3, 217, 4, 8080);
    			attr_dev(legend5, "class", "text-xl text-blue-800");
    			add_location(legend5, file$3, 239, 6, 8790);
    			add_location(fieldset1, file$3, 240, 6, 8861);
    			attr_dev(div7, "class", "p-4 shadow-lg ");
    			add_location(div7, file$3, 238, 4, 8755);
    			attr_dev(label, "for", "details");
    			attr_dev(label, "class", "block text-xl text-blue-800");
    			add_location(label, file$3, 266, 6, 9787);
    			attr_dev(textarea, "class", "form-textarea mt-1 w-full block h-24 border-1 rounded border-blue-600");
    			attr_dev(textarea, "name", "details");
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "placeholder", "Describe the issue.");
    			add_location(textarea, file$3, 267, 6, 9866);
    			attr_dev(div8, "class", "grid");
    			add_location(div8, file$3, 265, 4, 9762);
    			attr_dev(button2, "type", "submit");
    			attr_dev(button2, "class", "inline-block px-4 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out");
    			add_location(button2, file$3, 276, 6, 10143);
    			attr_dev(div9, "class", "grid place-content-center");
    			add_location(div9, file$3, 275, 4, 10097);
    			attr_dev(div10, "class", "grid grid-cols-2 pb-2 gap-4 font-mono text-sm font-bold leading-6 rounded-lg");
    			add_location(div10, file$3, 136, 2, 4411);
    			add_location(form, file$3, 135, 0, 4362);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, div10);
    			append_dev(div10, div0);
    			append_dev(div0, legend0);
    			append_dev(div0, t5);
    			append_dev(div0, input);
    			set_input_value(input, /*searchTerm*/ ctx[0]);
    			append_dev(div10, t6);
    			append_dev(div10, div1);
    			append_dev(div1, legend1);
    			append_dev(div1, t8);
    			append_dev(div1, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(select0, null);
    			}

    			select_option(select0, /*selectedHomeroom*/ ctx[1]);
    			append_dev(div10, t11);
    			append_dev(div10, div3);
    			append_dev(div3, div2);
    			append_dev(div2, legend2);
    			append_dev(div2, t13);
    			append_dev(div2, button0);
    			append_dev(div3, t15);
    			append_dev(div3, p1);
    			append_dev(div3, t17);
    			append_dev(div3, select1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select1, null);
    			}

    			select_options(select1, /*studentsToAddToList*/ ctx[9]);
    			append_dev(div10, t18);
    			append_dev(div10, div5);
    			append_dev(div5, div4);
    			append_dev(div4, legend3);
    			append_dev(div4, t20);
    			append_dev(div4, button1);
    			append_dev(div5, t22);
    			if_block0.m(div5, null);
    			append_dev(div10, t23);
    			append_dev(div10, div6);
    			append_dev(div6, legend4);
    			append_dev(div6, t25);
    			append_dev(div6, fieldset0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(fieldset0, null);
    			}

    			append_dev(div6, t26);
    			if (if_block1) if_block1.m(div6, null);
    			append_dev(div10, t27);
    			append_dev(div10, div7);
    			append_dev(div7, legend5);
    			append_dev(div7, t29);
    			append_dev(div7, fieldset1);
    			if_blocks[current_block_type_index].m(fieldset1, null);
    			append_dev(div10, t30);
    			append_dev(div10, div8);
    			append_dev(div8, label);
    			append_dev(div8, t32);
    			append_dev(div8, textarea);
    			set_input_value(textarea, /*details*/ ctx[3]);
    			append_dev(div10, t33);
    			append_dev(div10, div9);
    			append_dev(div9, button2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[16]),
    					listen_dev(input, "input", /*searchStudents*/ ctx[14], false, false, false),
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[17]),
    					listen_dev(button0, "click", /*addStudentToList*/ ctx[12], false, false, false),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[18]),
    					listen_dev(button1, "click", /*removeStudentFromList*/ ctx[13], false, false, false),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[23]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[15]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*searchTerm*/ 1 && input.value !== /*searchTerm*/ ctx[0]) {
    				set_input_value(input, /*searchTerm*/ ctx[0]);
    			}

    			if (dirty[0] & /*homerooms*/ 32) {
    				each_value_4 = /*homerooms*/ ctx[5];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_4(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_4.length;
    			}

    			if (dirty[0] & /*selectedHomeroom, homerooms*/ 34) {
    				select_option(select0, /*selectedHomeroom*/ ctx[1]);
    			}

    			if (dirty[0] & /*filteredStudents*/ 16) {
    				each_value_3 = /*filteredStudents*/ ctx[4];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_3(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_3.length;
    			}

    			if (dirty[0] & /*studentsToAddToList, filteredStudents*/ 528) {
    				select_options(select1, /*studentsToAddToList*/ ctx[9]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div5, null);
    				}
    			}

    			if (dirty[0] & /*level, displayCategories*/ 2052) {
    				each_value_1 = behaviorCategories;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(fieldset0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (!/*level*/ ctx[2]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div6, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block2 = if_blocks[current_block_type_index];

    				if (!if_block2) {
    					if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block2.c();
    				} else {
    					if_block2.p(ctx, dirty);
    				}

    				transition_in(if_block2, 1);
    				if_block2.m(fieldset1, null);
    			}

    			if (dirty[0] & /*details*/ 8) {
    				set_input_value(textarea, /*details*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(form);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			if_block0.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function uncheckBehaviorList() {
    	let checkboxes = document.getElementsByName("behaviorList");

    	for (let i = 0, n = checkboxes.length; i < n; i++) {
    		checkboxes[i].checked = false;
    	}
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Merit', slots, []);
    	onMount(() => getHomerooms());
    	let submitted = false;
    	let level = "";
    	let details = "";
    	let searchTerm = "";

    	// will show up in the multiselect box to choose students to add to the form
    	let filteredStudents = [];

    	// selected in the dropdown box
    	let selectedHomeroom;

    	let homerooms = [];

    	const getHomerooms = () => {
    		// search throug all student data and filter out the homerooms that haven't been added to the list and add them.
    		for (let studentObj of studentData) {
    			if (!homerooms.includes(studentObj.homeroom)) {
    				$$invalidate(5, homerooms = [...homerooms, studentObj.homeroom]);
    			}
    		}

    		$$invalidate(5, homerooms = homerooms.sort());
    	};

    	let categories = [];
    	let behaviorList = [];

    	function displayCategories() {
    		if (level === "Information") {
    			$$invalidate(6, categories = informationList);
    		} else if (level === "Level 1") {
    			$$invalidate(6, categories = level1List);
    		} else if (level === "Yellow Level") {
    			$$invalidate(6, categories = YCList);
    		} else if (level === "Orange Level") {
    			$$invalidate(6, categories = OCList);
    		} else if (level === "Red Level") {
    			$$invalidate(6, categories = RCList);
    		} else $$invalidate(6, categories = positiveList);

    		uncheckBehaviorList();
    	}

    	let selectedStudents = [];
    	let studentsToAddToList = [];
    	let studentsToRemoveFromList = [];

    	function addStudentToList() {
    		// selectedStudents = selectedStudents.concat(studentsToAddToList);
    		// loop through all candidates on the add to list.
    		for (let i = 0; i < studentsToAddToList.length; i++) {
    			let found = false;

    			// loop through all curretnly selected students
    			if (selectedStudents.some(student => student.id === studentsToAddToList[i].id)) {
    				/* selected Students contains the element we're looking for */
    				found = true;
    			}

    			// if not found, add to the selected Student list
    			if (!found) {
    				selectedStudents.push(studentsToAddToList[i]);
    			}
    		}

    		selectedStudents.sort((a, b) => a.name > b.name ? 1 : -1);
    		$$invalidate(8, selectedStudents);
    	}

    	function removeStudentFromList() {
    		for (let i = 0; i < studentsToRemoveFromList.length; i++) {
    			for (let j = selectedStudents.length - 1; j >= 0; j--) {
    				if (studentsToRemoveFromList[i].id == selectedStudents[j].id) {
    					selectedStudents.splice(j, 1);
    					$$invalidate(8, selectedStudents);
    				}
    			}
    		}
    	}

    	let getStudentsByHr = () => {
    		$$invalidate(0, searchTerm = "");
    		$$invalidate(4, filteredStudents = "");

    		if (selectedHomeroom === "All Homerooms") {
    			$$invalidate(4, filteredStudents = studentData.filter(student => student.homeroom));
    		} else {
    			$$invalidate(4, filteredStudents = studentData.filter(student => student.homeroom === selectedHomeroom));
    		}

    		return filteredStudents.sort((a, b) => a.name > b.name ? 1 : -1);
    	};

    	let searchStudents = () => {
    		$$invalidate(4, filteredStudents = studentData.filter(student => {
    			let studentName = student.name.toLowerCase();
    			return studentName.includes(searchTerm.toLowerCase());
    		}));

    		return filteredStudents.sort((a, b) => a.name > b.name ? 1 : -1);
    	};

    	function resetForm() {
    		uncheckBehaviorList();
    		$$invalidate(6, categories = []);
    		$$invalidate(6, categories);
    		$$invalidate(2, level = "");
    		$$invalidate(3, details = "");
    		$$invalidate(1, selectedHomeroom = "");
    		$$invalidate(0, searchTerm = "");
    		$$invalidate(8, selectedStudents = "");
    		$$invalidate(4, filteredStudents = "");
    	}

    	function handleSubmit() {
    		submitted = true;
    		let response = {};
    		response.level = level;
    		response.behaviorList = behaviorList;
    		response.details = details;
    		response.selectedStudents = selectedStudents;
    		console.table(response);
    		resetForm();
    	} //    JSON.stringify(response);

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Merit> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[], []];

    	function input_input_handler() {
    		searchTerm = this.value;
    		$$invalidate(0, searchTerm);
    	}

    	function select0_change_handler() {
    		selectedHomeroom = select_value(this);
    		($$invalidate(1, selectedHomeroom), $$invalidate(0, searchTerm));
    		$$invalidate(5, homerooms);
    	}

    	function select1_change_handler() {
    		studentsToAddToList = select_multiple_value(this);
    		$$invalidate(9, studentsToAddToList);
    		$$invalidate(4, filteredStudents);
    	}

    	function select_change_handler() {
    		studentsToRemoveFromList = select_multiple_value(this);
    		$$invalidate(10, studentsToRemoveFromList);
    		$$invalidate(8, selectedStudents);
    	}

    	function input_change_handler() {
    		level = this.__value;
    		$$invalidate(2, level);
    	}

    	function input_change_handler_1() {
    		behaviorList = get_binding_group_value($$binding_groups[0], this.__value, this.checked);
    		$$invalidate(7, behaviorList);
    	}

    	function textarea_input_handler() {
    		details = this.value;
    		$$invalidate(3, details);
    	}

    	$$self.$capture_state = () => ({
    		studentData,
    		behaviorCategories,
    		positiveList,
    		informationList,
    		level1List,
    		YCList,
    		OCList,
    		RCList,
    		onMount,
    		slide,
    		quintOut,
    		each,
    		submitted,
    		level,
    		details,
    		searchTerm,
    		filteredStudents,
    		selectedHomeroom,
    		homerooms,
    		getHomerooms,
    		categories,
    		behaviorList,
    		displayCategories,
    		uncheckBehaviorList,
    		selectedStudents,
    		studentsToAddToList,
    		studentsToRemoveFromList,
    		addStudentToList,
    		removeStudentFromList,
    		getStudentsByHr,
    		searchStudents,
    		resetForm,
    		handleSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ('submitted' in $$props) submitted = $$props.submitted;
    		if ('level' in $$props) $$invalidate(2, level = $$props.level);
    		if ('details' in $$props) $$invalidate(3, details = $$props.details);
    		if ('searchTerm' in $$props) $$invalidate(0, searchTerm = $$props.searchTerm);
    		if ('filteredStudents' in $$props) $$invalidate(4, filteredStudents = $$props.filteredStudents);
    		if ('selectedHomeroom' in $$props) $$invalidate(1, selectedHomeroom = $$props.selectedHomeroom);
    		if ('homerooms' in $$props) $$invalidate(5, homerooms = $$props.homerooms);
    		if ('categories' in $$props) $$invalidate(6, categories = $$props.categories);
    		if ('behaviorList' in $$props) $$invalidate(7, behaviorList = $$props.behaviorList);
    		if ('selectedStudents' in $$props) $$invalidate(8, selectedStudents = $$props.selectedStudents);
    		if ('studentsToAddToList' in $$props) $$invalidate(9, studentsToAddToList = $$props.studentsToAddToList);
    		if ('studentsToRemoveFromList' in $$props) $$invalidate(10, studentsToRemoveFromList = $$props.studentsToRemoveFromList);
    		if ('getStudentsByHr' in $$props) $$invalidate(26, getStudentsByHr = $$props.getStudentsByHr);
    		if ('searchStudents' in $$props) $$invalidate(14, searchStudents = $$props.searchStudents);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*searchTerm*/ 1) {
    			if (searchTerm) $$invalidate(1, selectedHomeroom = "");
    		}

    		if ($$self.$$.dirty[0] & /*selectedHomeroom*/ 2) {
    			if (selectedHomeroom) getStudentsByHr();
    		}
    	};

    	return [
    		searchTerm,
    		selectedHomeroom,
    		level,
    		details,
    		filteredStudents,
    		homerooms,
    		categories,
    		behaviorList,
    		selectedStudents,
    		studentsToAddToList,
    		studentsToRemoveFromList,
    		displayCategories,
    		addStudentToList,
    		removeStudentFromList,
    		searchStudents,
    		handleSubmit,
    		input_input_handler,
    		select0_change_handler,
    		select1_change_handler,
    		select_change_handler,
    		input_change_handler,
    		$$binding_groups,
    		input_change_handler_1,
    		textarea_input_handler
    	];
    }

    class Merit extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Merit",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Navbar.svelte generated by Svelte v3.44.3 */

    const file$2 = "src/components/Navbar.svelte";

    function create_fragment$2(ctx) {
    	let nav;
    	let div1;
    	let div0;
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let a2;
    	let t5;
    	let div3;
    	let div2;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div1 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "Home";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Merit";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "Admin";
    			t5 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div2.textContent = "tsampson";
    			attr_dev(a0, "href", "#/home/");
    			attr_dev(a0, "class", "hover:text-gray-300 mx-2 text-sm text-white");
    			add_location(a0, file$2, 5, 6, 171);
    			attr_dev(a1, "href", "#/merit/");
    			attr_dev(a1, "class", "hover:text-gray-300 mx-2 text-sm text-white");
    			add_location(a1, file$2, 6, 6, 256);
    			attr_dev(a2, "href", "#/admin/");
    			attr_dev(a2, "class", "hover:text-gray-300 rounded-full mx-2 py-1 px-2 text-sm text-white border border-gray-300");
    			attr_dev(a2, "style", "");
    			add_location(a2, file$2, 7, 6, 343);
    			add_location(div0, file$2, 4, 4, 159);
    			attr_dev(div1, "class", "flex-initial");
    			add_location(div1, file$2, 3, 2, 128);
    			attr_dev(div2, "class", "rounded-full py-1 px-6 bg-blue-700 text-sm text-gray-300 border border-gray-300");
    			attr_dev(div2, "style", "");
    			add_location(div2, file$2, 15, 4, 542);
    			add_location(div3, file$2, 14, 2, 532);
    			attr_dev(nav, "class", "flex items-center justify-between flex-wrap rounded-sm bg-gradient-to-r from-blue-500 to-blue-600 px-12 py-3");
    			add_location(nav, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div1);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(div0, t1);
    			append_dev(div0, a1);
    			append_dev(div0, t3);
    			append_dev(div0, a2);
    			append_dev(nav, t5);
    			append_dev(nav, div3);
    			append_dev(div3, div2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/routes/Admin.svelte generated by Svelte v3.44.3 */

    const file$1 = "src/routes/Admin.svelte";

    function create_fragment$1(ctx) {
    	let h2;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Admin component";
    			t1 = space();
    			p = element("p");
    			p.textContent = "This is placeholder text.";
    			add_location(h2, file$1, 0, 0, 0);
    			add_location(p, file$1, 2, 0, 26);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Admin', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Admin> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Admin extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Admin",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.3 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let nav;
    	let t;
    	let main;
    	let router;
    	let current;
    	nav = new Navbar({ $$inline: true });

    	router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(nav.$$.fragment);
    			t = space();
    			main = element("main");
    			create_component(router.$$.fragment);
    			attr_dev(main, "class", "p-4");
    			add_location(main, file, 15, 0, 375);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(nav, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(router, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(nav, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(main);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	const routes = {
    		"/": Home,
    		"/home/": Home,
    		"/merit/": Merit,
    		"/admin/": Admin
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Router, Home, Merit, Nav: Navbar, Admin, routes });
    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
