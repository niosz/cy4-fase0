//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
const { Log } = require("noctua-log");
const { Mongo } = require("noctua-mongo");
const { Collection } = require("mongodb");
const ProxyAgent = require("proxy-agent");
const { isText } = require("istextorbinary");
const html2json = require("noctua-html2json").html2json;
const urldecode = require("urldecode");
const multipart = require('parse-multipart-data');
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
const log = new Log("agent");
var BOOTED = false;
var proxies = Mongo.db.collection("PROXIES");
var traces = Mongo.db.collection("TRACES");
const maxLock = log.envn("AGENT_MAX_LOCK_TIME_MS");
const waitLock = log.envn("AGENT_WAIT_LOCK_TIME_MS");
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
class Agent {
    // --------------------------------------------------------------------------------------------------------------------------------------- ⏺ static

    //◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎
    static async docProxy(data) {
        var cmp = JSON.stringify(data);
        var time = log.nowd();
        var doc = {
                _id: data._id,
                uid: data.uid,
                mode: (typeof data.mode != "string") ? null : data.mode,
                username: (typeof data.username != "string") ? null : data.username,
                password: (typeof data.password != "string") ? null : data.password,
                server: (typeof data.server != "string") ? null : data.server,
                port: (typeof data.port != "number") ? null : data.port,
                active: (typeof data.active != "boolean") ? true : data.active,
                busy: (typeof data.busy != "boolean") ? false : data.busy,
                owner: (typeof data.owner != "string") ? null : data.owner,
                keep: (typeof data.keep != "number") ? null : data.keep,
                runs: (typeof data.runs != "number") ? 0 : data.runs,
                bads: (typeof data.bads != "number") ? 0 : data.bads,
                lastUrl: (typeof data.lastUrl != "string") ? null : data.lastUrl,
                lastRun: (typeof data.lastRun != "object") ? time : data.lastRun,
                lastEnd: (typeof data.lastEnd != "object") ? null : data.lastEnd,
                lastMs:  (typeof data.lastMs != "number") ? null : data.lastMs,
                insertDate: (typeof data.insertDate != "object") ? time : data.insertDate,
                editDate: (typeof data.editDate != "object") ? time : data.insertDate,
            }
            if (JSON.stringify(doc)!=cmp) {
                log.i("proxy id",doc._id,"updated");
                await proxies.updateOne({_id:doc._id},[{$set:{upsert:doc}},{$replaceRoot:{newRoot:"$upsert"}}],{upsert:true});
            }
            return doc;
    }

    //◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎
    /**
     * initialize agent class 
     * @param {string|Collection<Document>} proxiesCollection 
     * @param {string|Collection<Document>} tracesCollection 
     */
    static async boot(proxiesCollection,tracesCollection) {
        // --------------------------------------------------------------------------------------------------------------------- ⏺ init
        if (BOOTED) return;
        BOOTED = true;
        log.i("booting agent");
        if (proxiesCollection) {
            proxiesCollection = (proxiesCollection instanceof Collection) ? proxiesCollection.collectionName : proxiesCollection;
            if (proxies.collectionName != proxiesCollection) {
                log.i("create proxies collection");
                proxies = Mongo.db.collection(proxiesCollection);
            }
        }
        log.i("proxies collection mapped to",proxies.collectionName);
        if (tracesCollection) {
            tracesCollection = (tracesCollection instanceof Collection) ? tracesCollection.collectionName : tracesCollection;
            if (traces.collectionName != tracesCollection) {
                log.i("create traces collection");
                traces = Mongo.db.collection(tracesCollection);
            }
        }
        log.i("traces collection mapped to",traces.collectionName);
        // --------------------------------------------------------------------------------------------------------------------- ⏺ load
        if (!await Mongo.collectionExists(proxies)) {
            log.w("first initialization of",proxies.collectionName);
            await Mongo.collectionCreate(proxies);
            await Mongo.indexCreate({active:1,runs:1,lastRun:1},proxies);
            var initData = JSON.parse(log.load("proxies.json"));
            for(var i=0;i<initData.length;i++) await Agent.docProxy(initData[i]);
        } else {
            try {
                log.i("refreshing of",proxies.collectionName);
                await Mongo.indexCreate({active:1,runs:1,lastRun:1},proxies);
                var initData = JSON.parse(log.load("proxies.json"));
                var docs = (await proxies.find().toArray()).map((doc)=>{return doc._id});
                for(var i=0;i<initData.length;i++)
                    if (docs.indexOf(initData[i]._id)<0)
                        await Agent.docProxy(initData[i]);
            } catch(e) {
                log.i("no proxies.json file found, skipping refresh");
            }
        }
        // --------------------------------------------------------------------------------------------------------------------- ⏺ reset
        log.i("resetting inconsistent states");
        var time = log.nowd();
        var stat = await proxies.updateMany({busy: true},[{$set:{
            busy: false,
            owner: null,
            keep: null,
            lastRun: time,
            editDate: time
        }}]);
        log.i("resetted",stat.modifiedCount,"proxies");
        // --------------------------------------------------------------------------------------------------------------------- ⏺ done
        log.i("configuration complete");
    }

    //◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎
        static async #checkAgents(auuid) {
            const data = log.nowd();
            const time = log.milli() - maxLock;
            log.i("checking agent for",auuid,"at",data.toISOString());
            await proxies.aggregate([
            {
                $match:
                {
                    active: true,
                    $or: [
                        { 
                            busy: false 
                        },
                        {
                            busy: true,
                            owner: {$ne: auuid},
                            keep: {$gte: time}
                        }
                    ]
                },
            },
            {
                $sort: {
                    busy:1,
                    runs: 1,
                    lastRun: 1,
                },
            },
            {
                $limit: 1,
            },
            {
                $set: {
                    busy: true,
                    owner: auuid,
                    keep: data.getTime(),
                    editDate: data,
                },
            },
            {
                $merge: {
                    into: proxies.collectionName,
                    on: "_id",
                    whenMatched: "replace",
                    whenNotMatched: "discard",
                },
            },
        ]).toArray();
    }

    //◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎
    /**
     * returning a proxy for usage
     * @returns {Promise<Agent>}
     */
    static async getAgent() {
        // --------------------------------------------------------------------------------------------------------------------- ⏺ init
        log.i("requested agent");
        var auuid = log.uuid();
        var proxy = null;
        while (proxy == null) {
            await Agent.#checkAgents(auuid);
            var proxy = await proxies.findOne({owner: auuid});
            if (typeof proxy == "object" && proxy != null) break;
            log.w("agents are all busy wait",waitLock+"ms");
            await log.sleep(waitLock);
        }
        log.i("agent",proxy._id,"keeped");
        return new Agent(proxy);
    }

    //◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎
    /**
     * convert agent to frog
     * @param {object} agent
     * @returns {ProxyAgentFlog}
     */
    static getFrog(agent) { return agent; }

    // --------------------------------------------------------------------------------------------------------------------------------------- ⏺ instance
    #proxy; #agent;

    //◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎
    /**
     * instance worker agent
     * @param {object} proxy 
     */
    constructor(proxy) {
        this.#proxy = proxy;
        var proxyUrl = proxy.mode + "://";
        if (typeof proxy.username == "string" && proxy.username != "" && typeof proxy.password == "string" && proxy.password != "")
            proxyUrl += proxy.username + ":" + proxy.password + "@";
        proxyUrl += proxy.server + ":" + proxy.port;
        log.i("composed proxy url :",proxyUrl);
        this.#agent = new ProxyAgentFlog(proxyUrl,this.#proxy);
        log.i("generated agent");
    }

    //◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎
    /**
     * starting agent
     * @param {string} requestMethod 
     * @param {string} requestUrl 
     * @returns {Promise<ProxyAgentFlog>}
     */
    async start(requestMethod,requestUrl) { return await this.#agent.start(requestMethod,requestUrl); }
}
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
const imageFind = [ "bmp"      , "gif"      , "x-icon"      , "jpeg"      , "png"      , "svg"      , "webp"       ];
const imageMime = [ "image/bmp", "image/gif", "image/x-icon", "image/jpeg", "image/png", "image/svg", "image/webp" ];
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
class ProxyAgentFlog extends ProxyAgent {
    #proxy; 
    #traceUuid; 
    #traceRequestBody;
    #traceResponseBody;
    #proxyUrl; 
    #requestMethod;
    #requestUrl;
    #requestData;
    #responseData;
    get proxyUrl() { return this.#proxyUrl; }
    get requestMethod() { return this.#requestMethod; }
    get requestUrl() { return this.#requestUrl; }
    get traceUuid() { return this.#traceUuid; }
    get traceRequestBody() { return this.#traceRequestBody; }
    get traceResponseBody() { return this.#traceResponseBody; }
    /** @returns {Buffer} */ get requestData() { return this.#requestData; }
    /** @returns {Buffer} */ get responseData() { return this.#responseData; }

    //◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎
    /**
     * proxy agent frog instance
     * @param {string} proxyUrl 
     * @param {Collection<Document>} proxies 
     * @param {object} proxy 
     */
    constructor(proxyUrl,proxy) {
        super(proxyUrl);
        this.#proxyUrl = proxyUrl;
        this.#requestMethod = null;
        this.#requestUrl = null;
        this.#requestData = null;
        this.#responseData = null;
        this.#proxy = proxy;
        this.#traceUuid = null;
        this.#traceRequestBody = false;
        this.#traceResponseBody = false;
        log.i("created agent on proxy :",proxyUrl);
    };

    //◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎
    /** 
     * proxy agent frog start
     * @param {string} requestMethod
     * @param {string} requestUrl 
     * @returns {Promise<ProxyAgentFlog>}
     */
    async start(requestMethod,requestUrl) {
        this.#requestMethod = requestMethod;
        this.#requestUrl = requestUrl;
        var data = log.nowd();
        this.#proxy.runs++;
        this.#proxy.lastUrl = requestUrl;
        this.#proxy.lastRun = data;
        this.#proxy.editDate = data;
        this.#proxy = await Agent.docProxy(this.#proxy);
        log.i("agent started on url :",requestUrl);
        return this;
    }

    //◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎
    /**
     * proxy agent frog end
     * @param {boolean} [bad] default false 
     * @returns {Promise<ProxyAgentFlog>}
     */
    async ending(bad) {
        var data = log.nowd();
        if (bad) this.#proxy.bad++;
        this.#proxy.busy = false;
        this.#proxy.owner = null;
        this.#proxy.keep = null;
        this.#proxy.lastEnd = data;
        this.#proxy.lastMs = data.getTime() - this.#proxy.lastRun.getTime();
        this.#proxy.editDate = data;
        this.#proxy = await Agent.docProxy(this.#proxy);
        log.i("agent ended");
        return this;
    }

    //◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎
    /**
     * activate trace
     */
    enableTrace() {
        if (this.#traceUuid == null) {
            this.#traceUuid = log.uuid();
            log.i("agent trace enabled with id :",this.#traceUuid);
        }
    }
    /**
     * check trace status active/disactive
     * @returns {boolean}
     */
    isEnabledTrace() {
        return (this.#traceUuid == null) ? false : true;
    }
    /**
     * activate trace of request body
     */
    enableTraceRequestBody() {
        if (this.#traceUuid == null) return;
        if (this.#traceRequestBody == false) {
            log.i("agent trace request body enabled on id :",this.#traceUuid);
            this.#traceRequestBody = true;
        }
    }
    /**
     * activate trace of response body
     */
    enableTraceResponseBody() {
        if (this.#traceUuid == null) return;
        if (this.#traceResponseBody == false) {
            log.i("agent trace response body enabled on id :",this.#traceUuid);
            this.#traceResponseBody = true;
        }
    }

    //◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎
    /** 
     * append data for saving response body
     * @param {Buffer} chunck 
     */
    appendResponseData(chunk) {
        if (this.#traceUuid == null || this.#traceResponseBody == false) return;
        if (this.#responseData == null) this.#responseData = chunk;
        else this.#responseData = Buffer.concat([this.#responseData,chunk]);
    }

    //◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎
    /** 
     * append data for saving request body
     * @param {Buffer} chunck
     */
    appendRequestData(chunk) {
        if (this.#traceUuid == null || this.#traceRequestBody == false) return;
        if (this.#requestData == null) this.#requestData = chunk;
        else this.#requestData = Buffer.concat([this.#requestData,chunk]);
    }

    //◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎
    /**
     * management of buffers and convert binary data
     * @param {Buffer} buf 
     * @param {object} headers
     */
    #manageBuffer(buf,headers) {
        var res = {
            data: null,
            size: 0,
            mode: null,
            type: "unknown",
            text: null,
            html: null,
            json: null,
            form: null,
            part: null,
            base: null
        };
        if (buf != null) {
            res.data = buf;
            res.size = buf.length;
            if (isText(null,buf)) {
                // ----------------------------------------------------------------------------------------------------- ⏺ text
                res.mode = "text";
                res.text = buf.toString("utf8");
                // ----------------------------------------------------------------------------------- ⏺ html
                if (res.type == "unknown") {
                    try {
                        res.html = html2json(res.text); 
                        if (res.html.child[0].node != "text") {
                            res.html = log.simplify(res.html);
                            if (res.html != null) res.type = "html";
                            else res.html = null;
                        } else res.html = null;
                    } catch(e) {
                        res.html = null;
                        res.type = "unknown";
                    }
                }
                // ----------------------------------------------------------------------------------- ⏺ json
                if (res.type == "unknown") {
                    try {
                        res.json = log.simplify(log.parse(res.text));
                        if (res.json != null) res.type = "json";
                        else res.json = null;
                    } catch(e) {
                        res.json = null;
                        res.type = "unknown";
                    }
                }
                // ----------------------------------------------------------------------------------- ⏺ others
                if (res.type == "unknown") {
                    if (headers["content-type"]) res.type = headers["content-type"];
                }
                // ----------------------------------------------------------------------------------- ⏺ form url encoded
                if (res.type.indexOf("www-form-urlencoded") >=0 ) {
                    var form = null;
                    try {
                        var params = res.text.split("&");
                        for (var i=0;i<params.length;i++) {
                            try {
                                var keyval = params[i].split("=");
                                try { keyval[0] = urldecode(keyval[0].trim()).trim(); } catch { keyval[0] = null; }
                                try { keyval[1] = urldecode(keyval[1].trim()).trim(); } catch { keyval[1] = null; }
                                if (keyval[0]!=null && keyval[0]!="") {
                                    if (form == null) form = {};
                                    if (keyval[1]!=null && keyval[1]!="") 
                                            form[keyval[0]] = keyval[1];
                                    else    form[keyval[0]] = "<<<[NOVALUE]>>>";
                                }
                            } catch {}
                        }
                    } catch {}
                    if (form != null) {
                        res.type = "form";
                        res.form = form;
                    }
                }
                // ----------------------------------------------------------------------------------- ⏺ multipart data
                if (res.type.indexOf("multipart") >=0 ) {
                    var part = null;
                    try {
                        var boundary = res.type.split("boundary=")[1];
                        boundary = multipart.parse(res.data,boundary);
                        for (var i=0;i<boundary.length;i++) {
                            try {
                                var item = {
                                    name: (boundary[i].name != null && boundary[i].name.trim()!="") ? boundary[i].name.trim() : null,
                                    data: (boundary[i].data !=null && boundary[i].data.length>0) ? boundary[i].data : null
                                };
                                if (item.name != null) {
                                    if (part == null) part = {};
                                    part[item.name] = "<<<[NOVALUE]>>>";
                                    if (item.data != null) {
                                        if (isText(null,item.data))
                                                part[item.name] = item.data.toString("utf8");
                                        else    part[item.name] = item.data;
                                    }
                                }
                            } catch {}
                        }
                    } catch {}
                    if (part != null) {
                        res.type = "part";
                        res.part = part;
                    }
                }
                // ----------------------------------------------------------------------------------------------------- ⏺ remove binary
                res.data = null;
            } else {
                // ----------------------------------------------------------------------------------------------------- ⏺ binary
                res.mode = "binary";
                if (headers["content-type"]) res.type = headers["content-type"];
                if (res.type.indexOf("image") >=0 ) {
                    var base = null;
                    try {
                        var found = -1;
                        for (var i=0;i<imageFind.length;i++) {
                            if (res.type.indexOf(imageFind[i]) >=0) {
                                found = i;
                                break;
                            }
                        }
                        if (found >= 0)
                            base = `data:${imageMime[found]};base64,${res.data.toString("base64")}`;
                    } catch {}
                    if (base != null) {
                        res.type = "base";
                        res.base = base;
                        res.data = null;
                    }
                }
            }
        }
        return res;
    }

    //◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎◼︎
    /** 
     * saving data on database
     * @param {import("noctua-mitm/types").IContext} ctx
     * @param {boolean} isResponse 
     */
    async saveTraceData(ctx,isResponse) {
        if (this.#traceUuid == null) return;
        // ----------------------------------------------------------------------------------------------------- ⏺ context
        var context = {
            request: (!ctx.clientToProxyRequest) ? null : ctx.clientToProxyRequest,
            response: (!ctx.serverToProxyResponse) ? null : ctx.serverToProxyResponse
        };
        if (context.request) {
            var request = {
                method: context.request.method,
                url: context.request.url,
                headers: context.request.headers,
                body: null
            };
            context.request = request;
            context.request.body = this.#manageBuffer(this.requestData,context.request.headers);
        }
        if (context.response) {
            var response = {
                code: context.response.statusCode,
                headers: context.response.headers,
                body: null
            };
            context.response = response;
            context.response.body = this.#manageBuffer(this.responseData,context.response.headers);
        }
        context = Mongo.fixForDb(context);
        // ----------------------------------------------------------------------------------------------------- ⏺ mongo
        var data = log.nowd();
        var doc = {
            _id: this.#traceUuid,
            proxy: this.#proxyUrl,
            step: (!isResponse)?"request":"response",
            method: this.#requestMethod,
            url: this.#requestUrl,
            request: context.request,
            response: context.response,
            insertDate: data,
            editDate: data
        };
        //#region *** upsert pipeline *** 
        await traces.updateOne({_id:doc._id},[
            {
                $set: {
                    upsert: doc
                }
            },
            {
                $set: {
                    present: {
                        $cond: [
                            { $eq : [ "$insertDate", "$noval" ] },
                            false,
                            true
                        ]
                    }
                }
            },
            {
                $set: {
                    upsert: {
                        insertDate: {
                            $cond: [
                                { $eq: [ "$present" , false ] },
                                "$upsert.insertDate",
                                "$insertDate"
                            ]
                        },
                        request: {
                            $cond: [
                                { $eq: [ "$present" , false ] },
                                "$upsert.request",
                                {
                                    $cond: [
                                        { $ne: [ "$upsert.request", null ] },
                                        "$upsert.request",
                                        "$request"
                                    ]
                                }
                            ]
                        },
                        response: {
                            $cond: [
                                { $eq: [ "$present" , false ] },
                                "$upsert.response",
                                {
                                    $cond: [
                                        { $ne: [ "$upsert.response", null ] },
                                        "$upsert.response",
                                        "$response"
                                    ]
                                }
                            ]
                        }
                    }
                }
            },
            {
                $replaceRoot:{
                    newRoot:"$upsert"
                }
            }
        ],{upsert:true});
        //#endregion
        log.i("trace saved",(!isResponse)?"request":"response");
    }

}
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
module.exports = { Agent, ProxyAgentFlog };
