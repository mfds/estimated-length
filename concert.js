// ==UserScript==
// @name         Concert length
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  a quick way to have an estimate over a concert duration
// @author       Michele Fiordispina <michele.fiordispina@gmail.com>
// @match        https://www.setlist.fm/*.html
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @require      https://momentjs.com/downloads/moment.min.js
// @require      https://cdn.jsdelivr.net/npm/axios@0.18.0/dist/axios.min.js
// @require      https://cdn.jsdelivr.net/npm/axios-userscript-adapter@0.0.3/dist/axiosGmxhrAdapter.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM_log
// @run-at       document-end
// ==/UserScript==

let setList;
let lastFm;

const config = () => {
    const setListApiUrl = `https://api.setlist.fm/rest/1.0/`;
    const setListApiKey = `<YOUR_API_KEY>`;
    const lastFmApiKey = `<YOUR_API_KEY>`;
    const lastFmApiUrl = `http://ws.audioscrobbler.com/2.0/`;
    axios.defaults.adapter = axiosGmxhrAdapter;
    setList = axios.create({
        baseURL: setListApiUrl,
        headers: {
            'Accept': 'application/json',
            'x-api-key': setListApiKey,
            'Accept-Language': 'en',
        }
    });

    lastFm = axios.create({
        baseURL: lastFmApiUrl,
        params: {
            method: 'track.getInfo',
            api_key: lastFmApiKey,
            format: 'json',
        }
    });
}

const getSetlist = async (id) => {
    try {
        return (await setList.get(`/setlist/${id}`)).data;
    } catch (e) {
        return {};
    }
}

const getLength = async (artist, track) => {
    try {
        const data = (await lastFm.get('/', {
            params: {artist, track}
        })).data;

        return Number(data.track.duration);
    } catch (error) {
        return 0;
    }
};

const getArtist = (data) => data.artist.name;
const getSongs = (data, artist) => data.sets.set.reduce(
    (a, c) => [...a, ...c.song.map(s => s.cover ? [s.cover.name, s.name] : s.name)], []
);

const main = async (id) => {
    const data = await getSetlist(id);
    const artist = getArtist(data);
    const songs = getSongs(data, artist);

    const totalLength = await songs.reduce(async (a, c, i) => {
        const length = (await getLength(...(Array.isArray(c) ? c : [artist, c])));
        const duration = moment.utc(length).format("mm:ss");
        $('.songPart').eq(i).append(`<span style="float: right;">${duration}</span>`);
        return await a + length;
    }, Promise.resolve(0));

    const totalDuration = moment.utc(totalLength).format("HH:mm:ss");
    $('.amount').before(`<span>ED: ${totalDuration}</span>`);
};


(function() {
    'use strict';
    config();
    const id = document.location.href.match(/([a-z0-9]+).html/)[1];
    main(id);
})();
