/**
 *Copyright 2015 cujothek9
 *Modifications (including forks) of the code to fit personal needs are allowed only for personal use and should refer back to the original source.
 *This software is not for profit, any extension, or unauthorised person providing this software is not authorised to be in a position of any monetary gain from this use of this software. Any and all money gained under the use of the software (which includes donations) must be passed on to the original author.
 */


(function () {

    API.getWaitListPosition = function(id){
        if(typeof id === 'undefined' || id === null){
            id = API.getUser().id;
        }
        var wl = API.getWaitList();
        for(var i = 0; i < wl.length; i++){
            if(wl[i].id === id){
                return i;
            }
        }
        return -1;
    };

    var kill = function () {
        clearInterval(cujothek9.room.autodisableInterval);
        clearInterval(cujothek9.room.afkInterval);
        cujothek9.status = false;
    };


    var storeToStorage = function () {
        localStorage.setItem("cujothek9settings", JSON.stringify(cujothek9.settings));
        localStorage.setItem("cujothek9Room", JSON.stringify(cujothek9.room));
        var cujothek9StorageInfo = {
            time: Date.now(),
            stored: true,
            version: cujothek9.version
        };
        localStorage.setItem("cujothek9StorageInfo", JSON.stringify(cujothek9StorageInfo));

    };

    var subChat = function (chat, obj) {
        if (typeof chat === "undefined") {
            API.chatLog("There is a chat text missing.");
            console.log("There is a chat text missing.");
            return "[Error] No text message found.";

            // TODO: Get missing chat messages from source.
        }
        var lit = '%%';
        for (var prop in obj) {
            chat = chat.replace(lit + prop.toUpperCase() + lit, obj[prop]);
        }
        return chat;
    };

    var loadChat = function (cb) {
        if (!cb) cb = function () {
        };
        $.get("https://rawgit.com/cujothek9/source/master/lang/langIndex.json", function (json) {
            var link = cujothek9.chatLink;
            if (json !== null && typeof json !== "undefined") {
                langIndex = json;
                link = langIndex[cujothek9.settings.language.toLowerCase()];
                if (cujothek9.settings.chatLink !== cujothek9.chatLink) {
                    link = cujothek9.settings.chatLink;
                }
                else {
                    if (typeof link === "undefined") {
                        link = cujothek9.chatLink;
                    }
                }
                $.get(link, function (json) {
                    if (json !== null && typeof json !== "undefined") {
                        if (typeof json === "string") json = JSON.parse(json);
                        cujothek9.chat = json;
                        cb();
                    }
                });
            }
            else {
                $.get(cujothek9.chatLink, function (json) {
                    if (json !== null && typeof json !== "undefined") {
                        if (typeof json === "string") json = JSON.parse(json);
                        cujothek9.chat = json;
                        cb();
                    }
                });
            }
        });
    };

    var retrieveSettings = function () {
        var settings = JSON.parse(localStorage.getItem("cujothek9settings"));
        if (settings !== null) {
            for (var prop in settings) {
                cujothek9.settings[prop] = settings[prop];
            }
        }
    };

    var retrieveFromStorage = function () {
        var info = localStorage.getItem("cujothek9StorageInfo");
        if (info === null) API.chatLog(cujothek9.chat.nodatafound);
        else {
            var settings = JSON.parse(localStorage.getItem("cujothek9settings"));
            var room = JSON.parse(localStorage.getItem("cujothek9Room"));
            var elapsed = Date.now() - JSON.parse(info).time;
            if ((elapsed < 1 * 60 * 60 * 1000)) {
                API.chatLog(cujothek9.chat.retrievingdata);
                for (var prop in settings) {
                    cujothek9.settings[prop] = settings[prop];
                }
                cujothek9.room.users = room.users;
                cujothek9.room.afkList = room.afkList;
                cujothek9.room.historyList = room.historyList;
                cujothek9.room.mutedUsers = room.mutedUsers;
                //cujothek9.room.autoskip = room.autoskip;
                cujothek9.room.roomstats = room.roomstats;
                cujothek9.room.messages = room.messages;
                cujothek9.room.queue = room.queue;
                cujothek9.room.newBlacklisted = room.newBlacklisted;
                API.chatLog(cujothek9.chat.datarestored);
            }
        }
        var json_sett = null;
        var roominfo = document.getElementById("room-settings");
        info = roominfo.textContent;
        var ref_bot = "@cujothek9=";
        var ind_ref = info.indexOf(ref_bot);
        if (ind_ref > 0) {
            var link = info.substring(ind_ref + ref_bot.length, info.length);
            var ind_space = null;
            if (link.indexOf(" ") < link.indexOf("\n")) ind_space = link.indexOf(" ");
            else ind_space = link.indexOf("\n");
            link = link.substring(0, ind_space);
            $.get(link, function (json) {
                if (json !== null && typeof json !== "undefined") {
                    json_sett = JSON.parse(json);
                    for (var prop in json_sett) {
                        cujothek9.settings[prop] = json_sett[prop];
                    }
                }
            });
        }

    };

    String.prototype.splitBetween = function (a, b) {
        var self = this;
        self = this.split(a);
        for (var i = 0; i < self.length; i++) {
            self[i] = self[i].split(b);
        }
        var arr = [];
        for (var i = 0; i < self.length; i++) {
            if (Array.isArray(self[i])) {
                for (var j = 0; j < self[i].length; j++) {
                    arr.push(self[i][j]);
                }
            }
            else arr.push(self[i]);
        }
        return arr;
    };

    String.prototype.startsWith = function(str) {
      return this.substring(0, str.length) === str;
    };

    function linkFixer(msg) {
        var parts = msg.splitBetween('<a href="', '<\/a>');
        for (var i = 1; i < parts.length; i = i + 2) {
            var link = parts[i].split('"')[0];
            parts[i] = link;
        }
        var m = '';
        for (var i = 0; i < parts.length; i++) {
            m += parts[i];
        }
        return m;
    };

    function decodeEntities(s) {
        var str, temp = document.createElement('p');
        temp.innerHTML = s;
        str = temp.textContent || temp.innerText;
        temp = null;
        return str;
    };

    var botCreator = "null";
    var botMaintainer = "null"
    var botCreatorIDs = ["null", "null"];

    var cujothek9 = {
        version: "1.0.6",
        status: false,
        name: "cujothek9",
        loggedInID: null,
        scriptLink: "https://rawgit.com/cujothek9/source/master/cujothek9.js",
        cmdLink: "Please consult Charlotte for list of commands",
        chatLink: "https://rawgit.com/cujothek9/source/master/lang/en.json",
        chat: null,
        loadChat: loadChat,
        retrieveSettings: retrieveSettings,
        retrieveFromStorage: retrieveFromStorage,
        settings: {
            botName: "cujothek9",
            language: "english",
            chatLink: "https://rawgit.com/cujothek9/source/master/lang/en.json",
            scriptLink: "https://rawgit.com/cujothek9/source/master/cujothek9.js",
            roomLock: false, // Requires an extension to re-load the script
            startupCap: 1, // 1-200
            startupVolume: 0, // 0-100
            startupEmoji: false, // true or false
            autowoot: false,
            autoskip: false,
            smartSkip: true,
            cmdDeletion: true,
            maximumAfk: 120,
            afkRemoval: true,
            maximumDc: 60,
            bouncerPlus: true,
            blacklistEnabled: true,
            lockdownEnabled: false,
            lockGuard: false,
            maximumLocktime: 10,
            cycleGuard: true,
            maximumCycletime: 10,
            voteSkip: false,
            voteSkipLimit: 10,
            historySkip: false,
            timeGuard: true,
            maximumSongLength: 10,
            autodisable: false,
            commandCooldown: 0,
            usercommandsEnabled: true,
            thorCommand: false,
            thorCooldown: 10,
            skipPosition: 3,
            skipReasons: [
                ["theme", "This song does not fit the room theme. "],
                ["op", "This song is on the OP list. "],
                ["history", "This song is in the history. "],
                ["mix", "You played a mix, which is against the rules. "],
                ["sound", "The song you played had bad sound quality or no sound. "],
                ["nsfw", "The song you contained was NSFW (image or sound). "],
                ["unavailable", "The song you played was not available for some users. "]
            ],
            afkpositionCheck: 15,
            afkRankCheck: "ambassador",
            motdEnabled: false,
            motdInterval: 5,
            motd: "Temporary Message of the Day",
            filterChat: true,
            etaRestriction: false,
            welcome: true,
            opLink: null,
            rulesLink: null,
            themeLink: null,
            fbLink: null,
            youtubeLink: null,
            website: null,
            intervalMessages: [],
            messageInterval: 5,
            songstats: true,
            commandLiteral: "!",
            blacklists: {
                NSFW: "https://rawgit.com/cujothek9/custom/master/blacklists/NSFWlist.json",
                OP: "https://rawgit.com/cujothek9/custom/master/blacklists/OPlist.json",
                BANNED: "https://rawgit.com/cujothek9/custom/master/blacklists/BANNEDlist.json"
            }
        },
        room: {
            name: null,
            chatMessages: [],
            users: [],
            afkList: [],
            mutedUsers: [],
            bannedUsers: [],
            skippable: true,
            usercommand: true,
            allcommand: true,
            afkInterval: null,
            //autoskip: false,
            autoskipTimer: null,
            autodisableInterval: null,
            autodisableFunc: function () {
                if (cujothek9.status && cujothek9.settings.autodisable) {
                    API.sendChat('!afkdisable');
                    API.sendChat('!joindisable');
                }
            },
            queueing: 0,
            queueable: true,
            currentDJID: null,
            historyList: [],
            cycleTimer: setTimeout(function () {
            }, 1),
            roomstats: {
                accountName: null,
                totalWoots: 0,
                totalCurates: 0,
                totalMehs: 0,
                launchTime: null,
                songCount: 0,
                chatmessages: 0
            },
            messages: {
                from: [],
                to: [],
                message: []
            },
            queue: {
                id: [],
                position: []
            },
            blacklists: {

            },
            newBlacklisted: [],
            newBlacklistedSongFunction: null,
            roulette: {
                rouletteStatus: false,
                participants: [],
                countdown: null,
                startRoulette: function () {
                    cujothek9.room.roulette.rouletteStatus = true;
                    cujothek9.room.roulette.countdown = setTimeout(function () {
                        cujothek9.room.roulette.endRoulette();
                    }, 60 * 1000);
                    API.sendChat(cujothek9.chat.isopen);
                },
                endRoulette: function () {
                    cujothek9.room.roulette.rouletteStatus = false;
                    var ind = Math.floor(Math.random() * cujothek9.room.roulette.participants.length);
                    var winner = cujothek9.room.roulette.participants[ind];
                    cujothek9.room.roulette.participants = [];
                    var pos = Math.floor((Math.random() * API.getWaitList().length) + 1);
                    var user = cujothek9.userUtilities.lookupUser(winner);
                    var name = user.username;
                    API.sendChat(subChat(cujothek9.chat.winnerpicked, {name: name, position: pos}));
                    setTimeout(function (winner, pos) {
                        cujothek9.userUtilities.moveUser(winner, pos, false);
                    }, 1 * 1000, winner, pos);
                }
            },
            usersUsedThor: []
        },
        User: function (id, name) {
            this.id = id;
            this.username = name;
            this.jointime = Date.now();
            this.lastActivity = Date.now();
            this.votes = {
                woot: 0,
                meh: 0,
                curate: 0
            };
            this.lastEta = null;
            this.afkWarningCount = 0;
            this.afkCountdown = null;
            this.inRoom = true;
            this.isMuted = false;
            this.lastDC = {
                time: null,
                position: null,
                songCount: 0
            };
            this.lastKnownPosition = null;
        },
        userUtilities: {
            getJointime: function (user) {
                return user.jointime;
            },
            getUser: function (user) {
                return API.getUser(user.id);
            },
            updatePosition: function (user, newPos) {
                user.lastKnownPosition = newPos;
            },
            updateDC: function (user) {
                user.lastDC.time = Date.now();
                user.lastDC.position = user.lastKnownPosition;
                user.lastDC.songCount = cujothek9.room.roomstats.songCount;
            },
            setLastActivity: function (user) {
                user.lastActivity = Date.now();
                user.afkWarningCount = 0;
                clearTimeout(user.afkCountdown);
            },
            getLastActivity: function (user) {
                return user.lastActivity;
            },
            getWarningCount: function (user) {
                return user.afkWarningCount;
            },
            setWarningCount: function (user, value) {
                user.afkWarningCount = value;
            },
            lookupUser: function (id) {
                for (var i = 0; i < cujothek9.room.users.length; i++) {
                    if (cujothek9.room.users[i].id === id) {
                        return cujothek9.room.users[i];
                    }
                }
                return false;
            },
            lookupUserName: function (name) {
                for (var i = 0; i < cujothek9.room.users.length; i++) {
                    var match = cujothek9.room.users[i].username.trim() == name.trim();
                    if (match) {
                        return cujothek9.room.users[i];
                    }
                }
                return false;
            },
            voteRatio: function (id) {
                var user = cujothek9.userUtilities.lookupUser(id);
                var votes = user.votes;
                if (votes.meh === 0) votes.ratio = 1;
                else votes.ratio = (votes.woot / votes.meh).toFixed(2);
                return votes;

            },
            getPermission: function (obj) { //1 requests
                var u;
                if (typeof obj === "object") u = obj;
                else u = API.getUser(obj);
                for (var i = 0; i < botCreatorIDs.length; i++) {
                    if (botCreatorIDs[i].indexOf(u.id) > -1) return 10;
                }
                if (u.gRole < 2) return u.role;
                else {
                    switch (u.gRole) {
                        case 2:
                            return 7;
                        case 3:
                            return 8;
                        case 4:
                            return 9;
                        case 5:
                            return 10;
                    }
                }
                return 0;
            },
            moveUser: function (id, pos, priority) {
                var user = cujothek9.userUtilities.lookupUser(id);
                var wlist = API.getWaitList();
                if (API.getWaitListPosition(id) === -1) {
                    if (wlist.length < 50) {
                        API.moderateAddDJ(id);
                        if (pos !== 0) setTimeout(function (id, pos) {
                            API.moderateMoveDJ(id, pos);
                        }, 1250, id, pos);
                    }
                    else {
                        var alreadyQueued = -1;
                        for (var i = 0; i < cujothek9.room.queue.id.length; i++) {
                            if (cujothek9.room.queue.id[i] === id) alreadyQueued = i;
                        }
                        if (alreadyQueued !== -1) {
                            cujothek9.room.queue.position[alreadyQueued] = pos;
                            return API.sendChat(subChat(cujothek9.chat.alreadyadding, {position: cujothek9.room.queue.position[alreadyQueued]}));
                        }
                        cujothek9.roomUtilities.booth.lockBooth();
                        if (priority) {
                            cujothek9.room.queue.id.unshift(id);
                            cujothek9.room.queue.position.unshift(pos);
                        }
                        else {
                            cujothek9.room.queue.id.push(id);
                            cujothek9.room.queue.position.push(pos);
                        }
                        var name = user.username;
                        return API.sendChat(subChat(cujothek9.chat.adding, {name: name, position: cujothek9.room.queue.position.length}));
                    }
                }
                else API.moderateMoveDJ(id, pos);
            },
            dclookup: function (id) {
                var user = cujothek9.userUtilities.lookupUser(id);
                if (typeof user === 'boolean') return cujothek9.chat.usernotfound;
                var name = user.username;
                if (user.lastDC.time === null) return subChat(cujothek9.chat.notdisconnected, {name: name});
                var dc = user.lastDC.time;
                var pos = user.lastDC.position;
                if (pos === null) return cujothek9.chat.noposition;
                var timeDc = Date.now() - dc;
                var validDC = false;
                if (cujothek9.settings.maximumDc * 60 * 1000 > timeDc) {
                    validDC = true;
                }
                var time = cujothek9.roomUtilities.msToStr(timeDc);
                if (!validDC) return (subChat(cujothek9.chat.toolongago, {name: cujothek9.userUtilities.getUser(user).username, time: time}));
                var songsPassed = cujothek9.room.roomstats.songCount - user.lastDC.songCount;
                var afksRemoved = 0;
                var afkList = cujothek9.room.afkList;
                for (var i = 0; i < afkList.length; i++) {
                    var timeAfk = afkList[i][1];
                    var posAfk = afkList[i][2];
                    if (dc < timeAfk && posAfk < pos) {
                        afksRemoved++;
                    }
                }
                var newPosition = user.lastDC.position - songsPassed - afksRemoved;
                if (newPosition <= 0) return subChat(cujothek9.chat.notdisconnected, {name: name});
                var msg = subChat(cujothek9.chat.valid, {name: cujothek9.userUtilities.getUser(user).username, time: time, position: newPosition});
                cujothek9.userUtilities.moveUser(user.id, newPosition, true);
                return msg;
            }
        },

        roomUtilities: {
            rankToNumber: function (rankString) {
                var rankInt = null;
                switch (rankString) {
                    case "admin":
                        rankInt = 10;
                        break;
                    case "ambassador":
                        rankInt = 7;
                        break;
                    case "host":
                        rankInt = 5;
                        break;
                    case "cohost":
                        rankInt = 4;
                        break;
                    case "manager":
                        rankInt = 3;
                        break;
                    case "bouncer":
                        rankInt = 2;
                        break;
                    case "residentdj":
                        rankInt = 1;
                        break;
                    case "user":
                        rankInt = 0;
                        break;
                }
                return rankInt;
            },
            msToStr: function (msTime) {
                var ms, msg, timeAway;
                msg = '';
                timeAway = {
                    'days': 0,
                    'hours': 0,
                    'minutes': 0,
                    'seconds': 0
                };
                ms = {
                    'day': 24 * 60 * 60 * 1000,
                    'hour': 60 * 60 * 1000,
                    'minute': 60 * 1000,
                    'second': 1000
                };
                if (msTime > ms.day) {
                    timeAway.days = Math.floor(msTime / ms.day);
                    msTime = msTime % ms.day;
                }
                if (msTime > ms.hour) {
                    timeAway.hours = Math.floor(msTime / ms.hour);
                    msTime = msTime % ms.hour;
                }
                if (msTime > ms.minute) {
                    timeAway.minutes = Math.floor(msTime / ms.minute);
                    msTime = msTime % ms.minute;
                }
                if (msTime > ms.second) {
                    timeAway.seconds = Math.floor(msTime / ms.second);
                }
                if (timeAway.days !== 0) {
                    msg += timeAway.days.toString() + 'd';
                }
                if (timeAway.hours !== 0) {
                    msg += timeAway.hours.toString() + 'h';
                }
                if (timeAway.minutes !== 0) {
                    msg += timeAway.minutes.toString() + 'm';
                }
                if (timeAway.minutes < 1 && timeAway.hours < 1 && timeAway.days < 1) {
                    msg += timeAway.seconds.toString() + 's';
                }
                if (msg !== '') {
                    return msg;
                } else {
                    return false;
                }
            },
            booth: {
                lockTimer: setTimeout(function () {
                }, 1000),
                locked: false,
                lockBooth: function () {
                    API.moderateLockWaitList(!cujothek9.roomUtilities.booth.locked);
                    cujothek9.roomUtilities.booth.locked = false;
                    if (cujothek9.settings.lockGuard) {
                        cujothek9.roomUtilities.booth.lockTimer = setTimeout(function () {
                            API.moderateLockWaitList(cujothek9.roomUtilities.booth.locked);
                        }, cujothek9.settings.maximumLocktime * 60 * 1000);
                    }
                },
                unlockBooth: function () {
                    API.moderateLockWaitList(cujothek9.roomUtilities.booth.locked);
                    clearTimeout(cujothek9.roomUtilities.booth.lockTimer);
                }
            },
            afkCheck: function () {
                if (!cujothek9.status || !cujothek9.settings.afkRemoval) return void (0);
                var rank = cujothek9.roomUtilities.rankToNumber(cujothek9.settings.afkRankCheck);
                var djlist = API.getWaitList();
                var lastPos = Math.min(djlist.length, cujothek9.settings.afkpositionCheck);
                if (lastPos - 1 > djlist.length) return void (0);
                for (var i = 0; i < lastPos; i++) {
                    if (typeof djlist[i] !== 'undefined') {
                        var id = djlist[i].id;
                        var user = cujothek9.userUtilities.lookupUser(id);
                        if (typeof user !== 'boolean') {
                            var plugUser = cujothek9.userUtilities.getUser(user);
                            if (rank !== null && cujothek9.userUtilities.getPermission(plugUser) <= rank) {
                                var name = plugUser.username;
                                var lastActive = cujothek9.userUtilities.getLastActivity(user);
                                var inactivity = Date.now() - lastActive;
                                var time = cujothek9.roomUtilities.msToStr(inactivity);
                                var warncount = user.afkWarningCount;
                                if (inactivity > cujothek9.settings.maximumAfk * 60 * 1000) {
                                    if (warncount === 0) {
                                        API.sendChat(subChat(cujothek9.chat.warning1, {name: name, time: time}));
                                        user.afkWarningCount = 3;
                                        user.afkCountdown = setTimeout(function (userToChange) {
                                            userToChange.afkWarningCount = 1;
                                        }, 90 * 1000, user);
                                    }
                                    else if (warncount === 1) {
                                        API.sendChat(subChat(cujothek9.chat.warning2, {name: name}));
                                        user.afkWarningCount = 3;
                                        user.afkCountdown = setTimeout(function (userToChange) {
                                            userToChange.afkWarningCount = 2;
                                        }, 30 * 1000, user);
                                    }
                                    else if (warncount === 2) {
                                        var pos = API.getWaitListPosition(id);
                                        if (pos !== -1) {
                                            pos++;
                                            cujothek9.room.afkList.push([id, Date.now(), pos]);
                                            user.lastDC = {

                                                time: null,
                                                position: null,
                                                songCount: 0
                                            };
                                            API.moderateRemoveDJ(id);
                                            API.sendChat(subChat(cujothek9.chat.afkremove, {name: name, time: time, position: pos, maximumafk: cujothek9.settings.maximumAfk}));
                                        }
                                        user.afkWarningCount = 0;
                                    }
                                }
                            }
                        }
                    }
                }
            },
            smartSkip: function (reason) {
                var dj = API.getDJ();
                var id = dj.id;
                var waitlistlength = API.getWaitList().length;
                var locked = false;
                cujothek9.room.queueable = false;

                if (waitlistlength == 50) {
                    cujothek9.roomUtilities.booth.lockBooth();
                    locked = true;
                }
                setTimeout(function (id) {
                    API.moderateForceSkip();
                    setTimeout(function () {
                        if (typeof reason !== 'undefined') {
                            API.sendChat(reason);
                        }
                    }, 500);
                    cujothek9.room.skippable = false;
                    setTimeout(function () {
                        cujothek9.room.skippable = true
                    }, 5 * 1000);
                    setTimeout(function (id) {
                        cujothek9.userUtilities.moveUser(id, cujothek9.settings.skipPosition, false);
                        cujothek9.room.queueable = true;
                        if (locked) {
                            setTimeout(function () {
                                cujothek9.roomUtilities.booth.unlockBooth();
                            }, 1000);
                        }
                    }, 1500, id);
                }, 1000, id);
            },
            changeDJCycle: function () {
                $.getJSON('/_/rooms/state', function(data) {
                    if (data.data[0].booth.shouldCycle) { // checks "" "shouldCycle": true "" if its true
                        API.moderateDJCycle(false); // Disables the DJ Cycle
                        clearTimeout(cujothek9.room.cycleTimer); // Clear the cycleguard timer
                    } else { // If cycle is already disable; enable it
                        if (cujothek9.settings.cycleGuard) { // Is cycle guard on?
                        API.moderateDJCycle(true); // Enables DJ cycle
                        cujothek9.room.cycleTimer = setTimeout(function () {  // Start timer
                            API.moderateDJCycle(false); // Disable cycle
                        }, cujothek9.settings.maximumCycletime * 60 * 1000); // The time
                        } else { // So cycleguard is not on?
                         API.moderateDJCycle(true); // Enables DJ cycle
                        }
                    };
                });
            },
            intervalMessage: function () {
                var interval;
                if (cujothek9.settings.motdEnabled) interval = cujothek9.settings.motdInterval;
                else interval = cujothek9.settings.messageInterval;
                if ((cujothek9.room.roomstats.songCount % interval) === 0 && cujothek9.status) {
                    var msg;
                    if (cujothek9.settings.motdEnabled) {
                        msg = cujothek9.settings.motd;
                    }
                    else {
                        if (cujothek9.settings.intervalMessages.length === 0) return void (0);
                        var messageNumber = cujothek9.room.roomstats.songCount % cujothek9.settings.intervalMessages.length;
                        msg = cujothek9.settings.intervalMessages[messageNumber];
                    }
                    API.sendChat('/me '+msg);
                }
            },
            updateBlacklists: function () {
                for (var bl in cujothek9.settings.blacklists) {
                    cujothek9.room.blacklists[bl] = [];
                    if (typeof cujothek9.settings.blacklists[bl] === 'function') {
                        cujothek9.room.blacklists[bl] = cujothek9.settings.blacklists();
                    }
                    else if (typeof cujothek9.settings.blacklists[bl] === 'string') {
                        if (cujothek9.settings.blacklists[bl] === '') {
                            continue;
                        }
                        try {
                            (function (l) {
                                $.get(cujothek9.settings.blacklists[l], function (data) {
                                    if (typeof data === 'string') {
                                        data = JSON.parse(data);
                                    }
                                    var list = [];
                                    for (var prop in data) {
                                        if (typeof data[prop].mid !== 'undefined') {
                                            list.push(data[prop].mid);
                                        }
                                    }
                                    cujothek9.room.blacklists[l] = list;
                                })
                            })(bl);
                        }
                        catch (e) {
                            API.chatLog('Error setting' + bl + 'blacklist.');
                            console.log('Error setting' + bl + 'blacklist.');
                            console.log(e);
                        }
                    }
                }
            },
            logNewBlacklistedSongs: function () {
                if (typeof console.table !== 'undefined') {
                    console.table(cujothek9.room.newBlacklisted);
                }
                else {
                    console.log(cujothek9.room.newBlacklisted);
                }
            },
            exportNewBlacklistedSongs: function () {
                var list = {};
                for (var i = 0; i < cujothek9.room.newBlacklisted.length; i++) {
                    var track = cujothek9.room.newBlacklisted[i];
                    list[track.list] = [];
                    list[track.list].push({
                        title: track.title,
                        author: track.author,
                        mid: track.mid
                    });
                }
                return list;
            }
        },
        eventChat: function (chat) {
            chat.message = linkFixer(chat.message);
            chat.message = decodeEntities(chat.message);
            chat.message = chat.message.trim();

            cujothek9.room.chatMessages.push([chat.cid, chat.message, chat.sub, chat.timestamp, chat.type, chat.uid, chat.un]);

            for (var i = 0; i < cujothek9.room.users.length; i++) {
                if (cujothek9.room.users[i].id === chat.uid) {
                    cujothek9.userUtilities.setLastActivity(cujothek9.room.users[i]);
                    if (cujothek9.room.users[i].username !== chat.un) {
                        cujothek9.room.users[i].username = chat.un;
                    }
                }
            }
            if (cujothek9.chatUtilities.chatFilter(chat)) return void (0);
            if (!cujothek9.chatUtilities.commandCheck(chat))
                cujothek9.chatUtilities.action(chat);
        },
        eventUserjoin: function (user) {
            var known = false;
            var index = null;
            for (var i = 0; i < cujothek9.room.users.length; i++) {
                if (cujothek9.room.users[i].id === user.id) {
                    known = true;
                    index = i;
                }
            }
            var greet = true;
            var welcomeback = null;
            if (known) {
                cujothek9.room.users[index].inRoom = true;
                var u = cujothek9.userUtilities.lookupUser(user.id);
                var jt = u.jointime;
                var t = Date.now() - jt;
                if (t < 10 * 1000) greet = false;
                else welcomeback = true;
            }
            else {
                cujothek9.room.users.push(new cujothek9.User(user.id, user.username));
                welcomeback = false;
            }
            for (var j = 0; j < cujothek9.room.users.length; j++) {
                if (cujothek9.userUtilities.getUser(cujothek9.room.users[j]).id === user.id) {
                    cujothek9.userUtilities.setLastActivity(cujothek9.room.users[j]);
                    cujothek9.room.users[j].jointime = Date.now();
                }

            }
            if (cujothek9.settings.welcome && greet) {
                welcomeback ?
                    setTimeout(function (user) {
                        API.sendChat(subChat(cujothek9.chat.welcomeback, {name: user.username}));
                    }, 1 * 1000, user)
                    :
                    setTimeout(function (user) {
                        API.sendChat(subChat(cujothek9.chat.welcome, {name: user.username}));
                    }, 1 * 1000, user);
            }
        },
        eventUserleave: function (user) {
            var lastDJ = API.getHistory()[0].user.id;
            for (var i = 0; i < cujothek9.room.users.length; i++) {
                if (cujothek9.room.users[i].id === user.id) {
                    cujothek9.userUtilities.updateDC(cujothek9.room.users[i]);
                    cujothek9.room.users[i].inRoom = false;
                    if (lastDJ == user.id){
                        var user = cujothek9.userUtilities.lookupUser(cujothek9.room.users[i].id);
                        cujothek9.userUtilities.updatePosition(user, 0);
                        user.lastDC.time = null;
                        user.lastDC.position = user.lastKnownPosition;
                    }
                }
            }
        },
        eventVoteupdate: function (obj) {
            for (var i = 0; i < cujothek9.room.users.length; i++) {
                if (cujothek9.room.users[i].id === obj.user.id) {
                    if (obj.vote === 1) {
                        cujothek9.room.users[i].votes.woot++;
                    }
                    else {
                        cujothek9.room.users[i].votes.meh++;
                    }
                }
            }

            var mehs = API.getScore().negative;
            var woots = API.getScore().positive;
            var dj = API.getDJ();
            var timeLeft = API.getTimeRemaining();
            var timeElapsed = API.getTimeElapsed();

            if (cujothek9.settings.voteSkip) {
                if ((mehs - woots) >= (cujothek9.settings.voteSkipLimit)) {
                    API.sendChat(subChat(cujothek9.chat.voteskipexceededlimit, {name: dj.username, limit: cujothek9.settings.voteSkipLimit}));
                    if (cujothek9.settings.smartSkip && timeLeft > timeElapsed){
                        cujothek9.roomUtilities.smartSkip();
                    }
                    else {
                        API.moderateForceSkip();
                    }
                }
            }

        },
        eventCurateupdate: function (obj) {
            for (var i = 0; i < cujothek9.room.users.length; i++) {
                if (cujothek9.room.users[i].id === obj.user.id) {
                    cujothek9.room.users[i].votes.curate++;
                }
            }
        },
        eventDjadvance: function (obj) {
            if (cujothek9.settings.autowoot) {
                $("#woot").click(); // autowoot
            }

            var user = cujothek9.userUtilities.lookupUser(obj.dj.id)
            for(var i = 0; i < cujothek9.room.users.length; i++){
                if(cujothek9.room.users[i].id === user.id){
                    cujothek9.room.users[i].lastDC = {
                        time: null,
                        position: null,
                        songCount: 0
                    };
                }
            }

            var lastplay = obj.lastPlay;
            if (typeof lastplay === 'undefined') return;
            if (cujothek9.settings.songstats) {
                if (typeof cujothek9.chat.songstatistics === "undefined") {
                    API.sendChat("/me " + lastplay.media.author + " - " + lastplay.media.title + ": " + lastplay.score.positive + "W/" + lastplay.score.grabs + "G/" + lastplay.score.negative + "M.")
                }
                else {
                    API.sendChat(subChat(cujothek9.chat.songstatistics, {artist: lastplay.media.author, title: lastplay.media.title, woots: lastplay.score.positive, grabs: lastplay.score.grabs, mehs: lastplay.score.negative}))
                }
            }
            cujothek9.room.roomstats.totalWoots += lastplay.score.positive;
            cujothek9.room.roomstats.totalMehs += lastplay.score.negative;
            cujothek9.room.roomstats.totalCurates += lastplay.score.grabs;
            cujothek9.room.roomstats.songCount++;
            cujothek9.roomUtilities.intervalMessage();
            cujothek9.room.currentDJID = obj.dj.id;

            var blacklistSkip = setTimeout(function () {
                var mid = obj.media.format + ':' + obj.media.cid;
                for (var bl in cujothek9.room.blacklists) {
                    if (cujothek9.settings.blacklistEnabled) {
                        if (cujothek9.room.blacklists[bl].indexOf(mid) > -1) {
                            API.sendChat(subChat(cujothek9.chat.isblacklisted, {blacklist: bl}));
                            if (cujothek9.settings.smartSkip){
                                return cujothek9.roomUtilities.smartSkip();
                            }
                            else {
                                return API.moderateForceSkip();
                            }
                        }
                    }
                }
            }, 2000);
            var newMedia = obj.media;
            var timeLimitSkip = setTimeout(function () {
                if (cujothek9.settings.timeGuard && newMedia.duration > cujothek9.settings.maximumSongLength * 60 && !cujothek9.room.roomevent) {
                    var name = obj.dj.username;
                    API.sendChat(subChat(cujothek9.chat.timelimit, {name: name, maxlength: cujothek9.settings.maximumSongLength}));
                    if (cujothek9.settings.smartSkip){
                        return cujothek9.roomUtilities.smartSkip();
                    }
                    else {
                        return API.moderateForceSkip();
                    }
                }
            }, 2000);
            var format = obj.media.format;
            var cid = obj.media.cid;
            var naSkip = setTimeout(function () {
                if (format == 1){
                    $.getJSON('https://www.googleapis.com/youtube/v3/videos?id=' + cid + '&key=AIzaSyDcfWu9cGaDnTjPKhg_dy9mUh6H7i4ePZ0&part=snippet&callback=?', function (track){
                        if (typeof(track.items[0]) === 'undefined'){
                            var name = obj.dj.username;
                            API.sendChat(subChat(cujothek9.chat.notavailable, {name: name}));
                            if (cujothek9.settings.smartSkip){
                                return cujothek9.roomUtilities.smartSkip();
                            }
                            else {
                                return API.moderateForceSkip();
                            }
                        }
                    });
                }
                else {
                    var checkSong = SC.get('/tracks/' + cid, function (track){
                        if (typeof track.title === 'undefined'){
                            var name = obj.dj.username;
                            API.sendChat(subChat(cujothek9.chat.notavailable, {name: name}));
                            if (cujothek9.settings.smartSkip){
                                return cujothek9.roomUtilities.smartSkip();
                            }
                            else {
                                return API.moderateForceSkip();
                            }
                        }
                    });
                }
            }, 2000);
            clearTimeout(historySkip);
            if (cujothek9.settings.historySkip) {
                var alreadyPlayed = false;
                var apihistory = API.getHistory();
                var name = obj.dj.username;
                var historySkip = setTimeout(function () {
                    for (var i = 0; i < apihistory.length; i++) {
                        if (apihistory[i].media.cid === obj.media.cid) {
                            cujothek9.room.historyList[i].push(+new Date());
                            alreadyPlayed = true;
                            API.sendChat(subChat(cujothek9.chat.songknown, {name: name}));
                            if (cujothek9.settings.smartSkip){
                                return cujothek9.roomUtilities.smartSkip();
                            }
                            else {
                                return API.moderateForceSkip();
                            }
                        }
                    }
                    if (!alreadyPlayed) {
                        cujothek9.room.historyList.push([obj.media.cid, +new Date()]);
                    }
                }, 2000);
            }
            if (user.ownSong) {
                API.sendChat(subChat(cujothek9.chat.permissionownsong, {name: user.username}));
                user.ownSong = false;
            }
            clearTimeout(cujothek9.room.autoskipTimer);
            if (cujothek9.settings.autoskip) {
                var remaining = obj.media.duration * 1000;
                var startcid = API.getMedia().cid;
                cujothek9.room.autoskipTimer = setTimeout(function() {
                    var endcid = API.getMedia().cid;
                    if (startcid === endcid) {
                        //API.sendChat('Song stuck, skipping...');
                        API.moderateForceSkip();
                    }
                }, remaining + 5000);
            }
            storeToStorage();
            //sendToSocket();
        },
        eventWaitlistupdate: function (users) {
            if (users.length < 50) {
                if (cujothek9.room.queue.id.length > 0 && cujothek9.room.queueable) {
                    cujothek9.room.queueable = false;
                    setTimeout(function () {
                        cujothek9.room.queueable = true;
                    }, 500);
                    cujothek9.room.queueing++;
                    var id, pos;
                    setTimeout(
                        function () {
                            id = cujothek9.room.queue.id.splice(0, 1)[0];
                            pos = cujothek9.room.queue.position.splice(0, 1)[0];
                            API.moderateAddDJ(id, pos);
                            setTimeout(
                                function (id, pos) {
                                    API.moderateMoveDJ(id, pos);
                                    cujothek9.room.queueing--;
                                    if (cujothek9.room.queue.id.length === 0) setTimeout(function () {
                                        cujothek9.roomUtilities.booth.unlockBooth();
                                    }, 1000);
                                }, 1000, id, pos);
                        }, 1000 + cujothek9.room.queueing * 2500);
                }
            }
            for (var i = 0; i < users.length; i++) {
                var user = cujothek9.userUtilities.lookupUser(users[i].id);
                cujothek9.userUtilities.updatePosition(user, API.getWaitListPosition(users[i].id) + 1);
            }
        },
        chatcleaner: function (chat) {
            if (!cujothek9.settings.filterChat) return false;
            if (cujothek9.userUtilities.getPermission(chat.uid) > 1) return false;
            var msg = chat.message;
            var containsLetters = false;
            for (var i = 0; i < msg.length; i++) {
                ch = msg.charAt(i);
                if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === ':' || ch === '^') containsLetters = true;
            }
            if (msg === '') {
                return true;
            }
            if (!containsLetters && (msg.length === 1 || msg.length > 3)) return true;
            msg = msg.replace(/[ ,;.:\/=~+%^*\-\\"'&@#]/g, '');
            var capitals = 0;
            var ch;
            for (var i = 0; i < msg.length; i++) {
                ch = msg.charAt(i);
                if (ch >= 'A' && ch <= 'Z') capitals++;
            }
            if (capitals >= 40) {
                API.sendChat(subChat(cujothek9.chat.caps, {name: chat.un}));
                return true;
            }
            msg = msg.toLowerCase();
            if (msg === 'skip') {
                API.sendChat(subChat(cujothek9.chat.askskip, {name: chat.un}));
                return true;
            }
            for (var j = 0; j < cujothek9.chatUtilities.spam.length; j++) {
                if (msg === cujothek9.chatUtilities.spam[j]) {
                    API.sendChat(subChat(cujothek9.chat.spam, {name: chat.un}));
                    return true;
                }
            }
            return false;
        },
        chatUtilities: {
            chatFilter: function (chat) {
                var msg = chat.message;
                var perm = cujothek9.userUtilities.getPermission(chat.uid);
                var user = cujothek9.userUtilities.lookupUser(chat.uid);
                var isMuted = false;
                for (var i = 0; i < cujothek9.room.mutedUsers.length; i++) {
                    if (cujothek9.room.mutedUsers[i] === chat.uid) isMuted = true;
                }
                if (isMuted) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }
                if (cujothek9.settings.lockdownEnabled) {
                    if (perm === 0) {
                        API.moderateDeleteChat(chat.cid);
                        return true;
                    }
                }
                if (cujothek9.chatcleaner(chat)) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }
                if (cujothek9.settings.cmdDeletion && msg.startsWith(cujothek9.settings.commandLiteral)) {
                    API.moderateDeleteChat(chat.cid);
                }
                /**
                 var plugRoomLinkPatt = /(\bhttps?:\/\/(www.)?plug\.dj[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
                 if (plugRoomLinkPatt.exec(msg)) {
                    if (perm === 0) {
                        API.sendChat(subChat(cujothek9.chat.roomadvertising, {name: chat.un}));
                        API.moderateDeleteChat(chat.cid);
                        return true;
                    }
                }
                 **/
                if (msg.indexOf('http://adf.ly/') > -1) {
                    API.moderateDeleteChat(chat.cid);
                    API.sendChat(subChat(cujothek9.chat.adfly, {name: chat.un}));
                    return true;
                }
                if (msg.indexOf('autojoin was not enabled') > 0 || msg.indexOf('AFK message was not enabled') > 0 || msg.indexOf('!afkdisable') > 0 || msg.indexOf('!joindisable') > 0 || msg.indexOf('autojoin disabled') > 0 || msg.indexOf('AFK message disabled') > 0) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }

                var rlJoinChat = cujothek9.chat.roulettejoin;
                var rlLeaveChat = cujothek9.chat.rouletteleave;

                var joinedroulette = rlJoinChat.split('%%NAME%%');
                if (joinedroulette[1].length > joinedroulette[0].length) joinedroulette = joinedroulette[1];
                else joinedroulette = joinedroulette[0];

                var leftroulette = rlLeaveChat.split('%%NAME%%');
                if (leftroulette[1].length > leftroulette[0].length) leftroulette = leftroulette[1];
                else leftroulette = leftroulette[0];

                if ((msg.indexOf(joinedroulette) > -1 || msg.indexOf(leftroulette) > -1) && chat.uid === cujothek9.loggedInID) {
                    setTimeout(function (id) {
                        API.moderateDeleteChat(id);
                    }, 5 * 1000, chat.cid);
                    return true;
                }
                return false;
            },
            commandCheck: function (chat) {
                var cmd;
                if (chat.message.charAt(0) === cujothek9.settings.commandLiteral) {
                    var space = chat.message.indexOf(' ');
                    if (space === -1) {
                        cmd = chat.message;
                    }
                    else cmd = chat.message.substring(0, space);
                }
                else return false;
                var userPerm = cujothek9.userUtilities.getPermission(chat.uid);
                //console.log("name: " + chat.un + ", perm: " + userPerm);
                if (chat.message !== cujothek9.settings.commandLiteral + 'join' && chat.message !== cujothek9.settings.commandLiteral + "leave") {
                    if (userPerm === 0 && !cujothek9.room.usercommand) return void (0);
                    if (!cujothek9.room.allcommand) return void (0);
                }
                if (chat.message === cujothek9.settings.commandLiteral + 'eta' && cujothek9.settings.etaRestriction) {
                    if (userPerm < 2) {
                        var u = cujothek9.userUtilities.lookupUser(chat.uid);
                        if (u.lastEta !== null && (Date.now() - u.lastEta) < 1 * 60 * 60 * 1000) {
                            API.moderateDeleteChat(chat.cid);
                            return void (0);
                        }
                        else u.lastEta = Date.now();
                    }
                }
                var executed = false;

                for (var comm in cujothek9.commands) {
                    var cmdCall = cujothek9.commands[comm].command;
                    if (!Array.isArray(cmdCall)) {
                        cmdCall = [cmdCall]
                    }
                    for (var i = 0; i < cmdCall.length; i++) {
                        if (cujothek9.settings.commandLiteral + cmdCall[i] === cmd) {
                            cujothek9.commands[comm].functionality(chat, cujothek9.settings.commandLiteral + cmdCall[i]);
                            executed = true;
                            break;
                        }
                    }
                }

                if (executed && userPerm === 0) {
                    cujothek9.room.usercommand = false;
                    setTimeout(function () {
                        cujothek9.room.usercommand = true;
                    }, cujothek9.settings.commandCooldown * 1000);
                }
                if (executed) {
                    /*if (cujothek9.settings.cmdDeletion) {
                        API.moderateDeleteChat(chat.cid);
                    }*/

                    //cujothek9.room.allcommand = false;
                    //setTimeout(function () {
                        cujothek9.room.allcommand = true;
                    //}, 5 * 1000);
                }
                return executed;
            },
            action: function (chat) {
                var user = cujothek9.userUtilities.lookupUser(chat.uid);
                if (chat.type === 'message') {
                    for (var j = 0; j < cujothek9.room.users.length; j++) {
                        if (cujothek9.userUtilities.getUser(cujothek9.room.users[j]).id === chat.uid) {
                            cujothek9.userUtilities.setLastActivity(cujothek9.room.users[j]);
                        }

                    }
                }
                cujothek9.room.roomstats.chatmessages++;
            },
            spam: [
                'hueh', 'hu3', 'brbr', 'heu', 'brbr', 'kkkk', 'spoder', 'mafia', 'zuera', 'zueira',
                'zueria', 'aehoo', 'aheu', 'alguem', 'algum', 'brazil', 'zoeira', 'fuckadmins', 'affff', 'vaisefoder', 'huenaarea',
                'hitler', 'ashua', 'ahsu', 'ashau', 'lulz', 'huehue', 'hue', 'huehuehue', 'merda', 'pqp', 'puta', 'mulher', 'pula', 'retarda', 'caralho', 'filha', 'ppk',
                'gringo', 'fuder', 'foder', 'hua', 'ahue', 'modafuka', 'modafoka', 'mudafuka', 'mudafoka', 'ooooooooooooooo', 'foda'
            ],
            curses: [
                'nigger', 'faggot', 'nigga', 'niqqa', 'motherfucker', 'modafocka'
            ]
        },
        connectAPI: function () {
            this.proxy = {
                eventChat: $.proxy(this.eventChat, this),
                eventUserskip: $.proxy(this.eventUserskip, this),
                eventUserjoin: $.proxy(this.eventUserjoin, this),
                eventUserleave: $.proxy(this.eventUserleave, this),
                //eventFriendjoin: $.proxy(this.eventFriendjoin, this),
                eventVoteupdate: $.proxy(this.eventVoteupdate, this),
                eventCurateupdate: $.proxy(this.eventCurateupdate, this),
                eventRoomscoreupdate: $.proxy(this.eventRoomscoreupdate, this),
                eventDjadvance: $.proxy(this.eventDjadvance, this),
                //eventDjupdate: $.proxy(this.eventDjupdate, this),
                eventWaitlistupdate: $.proxy(this.eventWaitlistupdate, this),
                eventVoteskip: $.proxy(this.eventVoteskip, this),
                eventModskip: $.proxy(this.eventModskip, this),
                eventChatcommand: $.proxy(this.eventChatcommand, this),
                eventHistoryupdate: $.proxy(this.eventHistoryupdate, this),

            };
            API.on(API.CHAT, this.proxy.eventChat);
            API.on(API.USER_SKIP, this.proxy.eventUserskip);
            API.on(API.USER_JOIN, this.proxy.eventUserjoin);
            API.on(API.USER_LEAVE, this.proxy.eventUserleave);
            API.on(API.VOTE_UPDATE, this.proxy.eventVoteupdate);
            API.on(API.GRAB_UPDATE, this.proxy.eventCurateupdate);
            API.on(API.ROOM_SCORE_UPDATE, this.proxy.eventRoomscoreupdate);
            API.on(API.ADVANCE, this.proxy.eventDjadvance);
            API.on(API.WAIT_LIST_UPDATE, this.proxy.eventWaitlistupdate);
            API.on(API.MOD_SKIP, this.proxy.eventModskip);
            API.on(API.CHAT_COMMAND, this.proxy.eventChatcommand);
            API.on(API.HISTORY_UPDATE, this.proxy.eventHistoryupdate);
        },
        disconnectAPI: function () {
            API.off(API.CHAT, this.proxy.eventChat);
            API.off(API.USER_SKIP, this.proxy.eventUserskip);
            API.off(API.USER_JOIN, this.proxy.eventUserjoin);
            API.off(API.USER_LEAVE, this.proxy.eventUserleave);
            API.off(API.VOTE_UPDATE, this.proxy.eventVoteupdate);
            API.off(API.CURATE_UPDATE, this.proxy.eventCurateupdate);
            API.off(API.ROOM_SCORE_UPDATE, this.proxy.eventRoomscoreupdate);
            API.off(API.ADVANCE, this.proxy.eventDjadvance);
            API.off(API.WAIT_LIST_UPDATE, this.proxy.eventWaitlistupdate);
            API.off(API.MOD_SKIP, this.proxy.eventModskip);
            API.off(API.CHAT_COMMAND, this.proxy.eventChatcommand);
            API.off(API.HISTORY_UPDATE, this.proxy.eventHistoryupdate);
        },
        startup: function () {
            Function.prototype.toString = function () {
                return 'Function.'
            };
            var u = API.getUser();
            if (cujothek9.userUtilities.getPermission(u) < 2) return API.chatLog(cujothek9.chat.greyuser);
            if (cujothek9.userUtilities.getPermission(u) === 2) API.chatLog(cujothek9.chat.bouncer);
            cujothek9.connectAPI();
            API.moderateDeleteChat = function (cid) {
                $.ajax({
                    url: "/_/chat/" + cid,
                    type: "DELETE"
                })
            };

            cujothek9.room.name = window.location.pathname;
            var Check;

            console.log(cujothek9.room.name);

            var detect = function(){
                if(cujothek9.room.name != window.location.pathname){
                    console.log("Killing bot after room change.");
                    storeToStorage();
                    cujothek9.disconnectAPI();
                    setTimeout(function () {
                        kill();
                    }, 1000);
                    if (cujothek9.settings.roomLock){
                        window.location = cujothek9.room.name;
                    }
                    else {
                        clearInterval(Check);
                    }
                }
            };

            Check = setInterval(function(){ detect() }, 2000);

            retrieveSettings();
            retrieveFromStorage();
            window.bot = cujothek9;
            cujothek9.roomUtilities.updateBlacklists();
            setInterval(cujothek9.roomUtilities.updateBlacklists, 60 * 60 * 1000);
            cujothek9.getNewBlacklistedSongs = cujothek9.roomUtilities.exportNewBlacklistedSongs;
            cujothek9.logNewBlacklistedSongs = cujothek9.roomUtilities.logNewBlacklistedSongs;
            if (cujothek9.room.roomstats.launchTime === null) {
                cujothek9.room.roomstats.launchTime = Date.now();
            }

            for (var j = 0; j < cujothek9.room.users.length; j++) {
                cujothek9.room.users[j].inRoom = false;
            }
            var userlist = API.getUsers();
            for (var i = 0; i < userlist.length; i++) {
                var known = false;
                var ind = null;
                for (var j = 0; j < cujothek9.room.users.length; j++) {
                    if (cujothek9.room.users[j].id === userlist[i].id) {
                        known = true;
                        ind = j;
                    }
                }
                if (known) {
                    cujothek9.room.users[ind].inRoom = true;
                }
                else {
                    cujothek9.room.users.push(new cujothek9.User(userlist[i].id, userlist[i].username));
                    ind = cujothek9.room.users.length - 1;
                }
                var wlIndex = API.getWaitListPosition(cujothek9.room.users[ind].id) + 1;
                cujothek9.userUtilities.updatePosition(cujothek9.room.users[ind], wlIndex);
            }
            cujothek9.room.afkInterval = setInterval(function () {
                cujothek9.roomUtilities.afkCheck()
            }, 10 * 1000);
            cujothek9.room.autodisableInterval = setInterval(function () {
                cujothek9.room.autodisableFunc();
            }, 60 * 60 * 1000);
            cujothek9.loggedInID = API.getUser().id;
            cujothek9.status = true;
            API.sendChat('/cap ' + cujothek9.settings.startupCap);
            API.setVolume(cujothek9.settings.startupVolume);
            if (cujothek9.settings.autowoot) {
                $("#woot").click();
            }
            if (cujothek9.settings.startupEmoji) {
                var emojibuttonoff = $(".icon-emoji-off");
                if (emojibuttonoff.length > 0) {
                    emojibuttonoff[0].click();
                }
                API.chatLog(':smile: Emojis enabled.');
            }
            else {
                var emojibuttonon = $(".icon-emoji-on");
                if (emojibuttonon.length > 0) {
                    emojibuttonon[0].click();
                }
                API.chatLog('Emojis disabled.');
            }
            API.chatLog('Avatars capped at ' + cujothek9.settings.startupCap);
            API.chatLog('Volume set to ' + cujothek9.settings.startupVolume);
            //socket();
            loadChat(API.sendChat(subChat(cujothek9.chat.online, {botname: cujothek9.settings.botName, version: cujothek9.version})));
        },
        commands: {
            executable: function (minRank, chat) {
                var id = chat.uid;
                var perm = cujothek9.userUtilities.getPermission(id);
                var minPerm;
                switch (minRank) {
                    case 'admin':
                        minPerm = 10;
                        break;
                    case 'ambassador':
                        minPerm = 7;
                        break;
                    case 'host':
                        minPerm = 5;
                        break;
                    case 'cohost':
                        minPerm = 4;
                        break;
                    case 'manager':
                        minPerm = 3;
                        break;
                    case 'mod':
                        if (cujothek9.settings.bouncerPlus) {
                            minPerm = 2;
                        }
                        else {
                            minPerm = 3;
                        }
                        break;
                    case 'bouncer':
                        minPerm = 2;
                        break;
                    case 'residentdj':
                        minPerm = 1;
                        break;
                    case 'user':
                        minPerm = 0;
                        break;
                    default:
                        API.chatLog('error assigning minimum permission');
                }
                return perm >= minPerm;

            },
            /**
             command: {
                        command: 'cmd',
                        rank: 'user/bouncer/mod/manager',
                        type: 'startsWith/exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !cujothek9.commands.executable(this.rank, chat) ) return void (0);
                                else{

                                }
                        }
                },
             **/

            activeCommand: {
                command: 'active',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var now = Date.now();
                        var chatters = 0;
                        var time;

                        var launchT = cujothek9.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;
                        var since = durationOnline / 1000;

                        if (msg.length === cmd.length) time = since;
                        else {
                            time = msg.substring(cmd.length + 1);
                            if (isNaN(time)) return API.sendChat(subChat(cujothek9.chat.invalidtime, {name: chat.un}));
                        }
                        for (var i = 0; i < cujothek9.room.users.length; i++) {
                            userTime = cujothek9.userUtilities.getLastActivity(cujothek9.room.users[i]);
                            if ((now - userTime) <= (time * 60 * 1000)) {
                                chatters++;
                            }
                        }
                        API.sendChat(subChat(cujothek9.chat.activeusersintime, {name: chat.un, amount: chatters, time: time}));
                    }
                }
            },

            addCommand: {
                command: 'add',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(cujothek9.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substr(cmd.length + 2);
                        var user = cujothek9.userUtilities.lookupUserName(name);
                        if (msg.length > cmd.length + 2) {
                            if (typeof user !== 'undefined') {
                                if (cujothek9.room.roomevent) {
                                    cujothek9.room.eventArtists.push(user.id);
                                }
                                API.moderateAddDJ(user.id);
                            } else API.sendChat(subChat(cujothek9.chat.invaliduserspecified, {name: chat.un}));
                        }
                    }
                }
            },

            afklimitCommand: {
                command: 'afklimit',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(cujothek9.chat.nolimitspecified, {name: chat.un}));
                        var limit = msg.substring(cmd.length + 1);
                        if (!isNaN(limit)) {
                            cujothek9.settings.maximumAfk = parseInt(limit, 10);
                            API.sendChat(subChat(cujothek9.chat.maximumafktimeset, {name: chat.un, time: cujothek9.settings.maximumAfk}));
                        }
                        else API.sendChat(subChat(cujothek9.chat.invalidlimitspecified, {name: chat.un}));
                    }
                }
            },

            afkremovalCommand: {
                command: 'afkremoval',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.settings.afkRemoval) {
                            cujothek9.settings.afkRemoval = !cujothek9.settings.afkRemoval;
                            clearInterval(cujothek9.room.afkInterval);
                            API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.afkremoval}));
                        }
                        else {
                            cujothek9.settings.afkRemoval = !cujothek9.settings.afkRemoval;
                            cujothek9.room.afkInterval = setInterval(function () {
                                cujothek9.roomUtilities.afkCheck()
                            }, 2 * 1000);
                            API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.afkremoval}));
                        }
                    }
                }
            },

            afkresetCommand: {
                command: 'afkreset',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(cujothek9.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = cujothek9.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(cujothek9.chat.invaliduserspecified, {name: chat.un}));
                        cujothek9.userUtilities.setLastActivity(user);
                        API.sendChat(subChat(cujothek9.chat.afkstatusreset, {name: chat.un, username: name}));
                    }
                }
            },

            afktimeCommand: {
                command: 'afktime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(cujothek9.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = cujothek9.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(cujothek9.chat.invaliduserspecified, {name: chat.un}));
                        var lastActive = cujothek9.userUtilities.getLastActivity(user);
                        var inactivity = Date.now() - lastActive;
                        var time = cujothek9.roomUtilities.msToStr(inactivity);

                        var launchT = cujothek9.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;

                        if (inactivity == durationOnline){
                            API.sendChat(subChat(cujothek9.chat.inactivelonger, {botname: cujothek9.settings.botName, name: chat.un, username: name}));
                        } else {
                        API.sendChat(subChat(cujothek9.chat.inactivefor, {name: chat.un, username: name, time: time}));
                        }
                    }
                }
            },

            autodisableCommand: {
                command: 'autodisable',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.settings.autodisable) {
                            cujothek9.settings.autodisable = !cujothek9.settings.autodisable;
                            return API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.autodisable}));
                        }
                        else {
                            cujothek9.settings.autodisable = !cujothek9.settings.autodisable;
                            return API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.autodisable}));
                        }

                    }
                }
            },

            autoskipCommand: {
                command: 'autoskip',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.settings.autoskip) {
                            cujothek9.settings.autoskip = !cujothek9.settings.autoskip;
                            clearTimeout(cujothek9.room.autoskipTimer);
                            return API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.autoskip}));
                        }
                        else {
                            cujothek9.settings.autoskip = !cujothek9.settings.autoskip;
                            return API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.autoskip}));
                        }
                    }
                }
            },

            autowootCommand: {
                command: 'autowoot',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(cujothek9.chat.autowoot);
                    }
                }
            },

            baCommand: {
                command: 'ba',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(cujothek9.chat.brandambassador);
                    }
                }
            },

            ballCommand: {
                command: ['8ball', 'ask'],
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                            var crowd = API.getUsers();
                            var msg = chat.message;
                            var argument = msg.substring(cmd.length + 1).replace(/@/g, '');
                            var randomUser = Math.floor(Math.random() * crowd.length);
                            var randomBall = Math.floor(Math.random() * cujothek9.chat.balls.length);
                            var randomSentence = Math.floor(Math.random() * 1);
                            API.sendChat(subChat(cujothek9.chat.ball, {name: chat.un, botname: cujothek9.settings.botName, question: argument, response: cujothek9.chat.balls[randomBall]}));
                     }
                }
            },

            banCommand: {
                command: 'ban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(cujothek9.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substr(cmd.length + 2);
                        var user = cujothek9.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(cujothek9.chat.invaliduserspecified, {name: chat.un}));
                        var permFrom = cujothek9.userUtilities.getPermission(chat.uid);
                        var permUser = cujothek9.userUtilities.getPermission(user.id);
                        if (permUser >= permFrom) return void(0);
                        API.moderateBanUser(user.id, 1, API.BAN.DAY);
                    }
                }
            },

            blacklistCommand: {
                command: ['blacklist', 'bl'],
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(cujothek9.chat.nolistspecified, {name: chat.un}));
                        var list = msg.substr(cmd.length + 1);
                        if (typeof cujothek9.room.blacklists[list] === 'undefined') return API.sendChat(subChat(cujothek9.chat.invalidlistspecified, {name: chat.un}));
                        else {
                            var media = API.getMedia();
                            var timeLeft = API.getTimeRemaining();
                            var timeElapsed = API.getTimeElapsed();
                            var track = {
                                list: list,
                                author: media.author,
                                title: media.title,
                                mid: media.format + ':' + media.cid
                            };
                            cujothek9.room.newBlacklisted.push(track);
                            cujothek9.room.blacklists[list].push(media.format + ':' + media.cid);
                            API.sendChat(subChat(cujothek9.chat.newblacklisted, {name: chat.un, blacklist: list, author: media.author, title: media.title, mid: media.format + ':' + media.cid}));
                            if (cujothek9.settings.smartSkip && timeLeft > timeElapsed){
                                cujothek9.roomUtilities.smartSkip();
                            }
                            else {
                                API.moderateForceSkip();
                            }
                            if (typeof cujothek9.room.newBlacklistedSongFunction === 'function') {
                                cujothek9.room.newBlacklistedSongFunction(track);
                            }
                        }
                    }
                }
            },

            blinfoCommand: {
                command: 'blinfo',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var author = API.getMedia().author;
                        var title = API.getMedia().title;
                        var name = chat.un;
                        var format = API.getMedia().format;
                        var cid = API.getMedia().cid;
                        var songid = format + ":" + cid;

                        API.sendChat(subChat(cujothek9.chat.blinfo, {name: name, author: author, title: title, songid: songid}));
                    }
                }
            },

            bouncerPlusCommand: {
                command: 'bouncer+',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (cujothek9.settings.bouncerPlus) {
                            cujothek9.settings.bouncerPlus = false;
                            return API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': 'Bouncer+'}));
                        }
                        else {
                            if (!cujothek9.settings.bouncerPlus) {
                                var id = chat.uid;
                                var perm = cujothek9.userUtilities.getPermission(id);
                                if (perm > 2) {
                                    cujothek9.settings.bouncerPlus = true;
                                    return API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': 'Bouncer+'}));
                                }
                            }
                            else return API.sendChat(subChat(cujothek9.chat.bouncerplusrank, {name: chat.un}));
                        }
                    }
                }
            },

            botnameCommand: {
                command: 'botname',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat(cujothek9.chat.currentbotname, {botname: cujothek9.settings.botName}));
                        var argument = msg.substring(cmd.length + 1);
                        if (argument) {
                            cujothek9.settings.botName = argument;
                            API.sendChat(subChat(cujothek9.chat.botnameset, {botName: cujothek9.settings.botName}));
                        }
                    }
                }
            },

            clearchatCommand: {
                command: 'clearchat',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var currentchat = $('#chat-messages').children();
                        for (var i = 0; i < currentchat.length; i++) {
                            API.moderateDeleteChat(currentchat[i].getAttribute("data-cid"));
                        }
                        return API.sendChat(subChat(cujothek9.chat.chatcleared, {name: chat.un}));
                    }
                }
            },

            clearlocalstorageCommand: {
                command: 'clearlocalstorage',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        localStorage.clear();
                        API.chatLog('Cleared localstorage, please refresh the page!');
                    }
                }
            },

            cmddeletionCommand: {
                command: ['commanddeletion', 'cmddeletion', 'cmddel'],
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.settings.cmdDeletion) {
                            cujothek9.settings.cmdDeletion = !cujothek9.settings.cmdDeletion;
                            API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.cmddeletion}));
                        }
                        else {
                            cujothek9.settings.cmdDeletion = !cujothek9.settings.cmdDeletion;
                            API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.cmddeletion}));
                        }
                    }
                }
            },

            commandsCommand: {
                command: 'commands',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(subChat(cujothek9.chat.commandslink, {botname: cujothek9.settings.botName, link: cujothek9.cmdLink}));
                    }
                }
            },

            cookieCommand: {
                command: 'cookie',
                rank: 'user',
                type: 'startsWith',
                getCookie: function (chat) {
                    var c = Math.floor(Math.random() * cujothek9.chat.cookies.length);
                    return cujothek9.chat.cookies[c];
                },
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;

                        var space = msg.indexOf(' ');
                        if (space === -1) {
                            API.sendChat(cujothek9.chat.eatcookie);
                            return false;
                        }
                        else {
                            var name = msg.substring(space + 2);
                            var user = cujothek9.userUtilities.lookupUserName(name);
                            if (user === false || !user.inRoom) {
                                return API.sendChat(subChat(cujothek9.chat.nousercookie, {name: name}));
                            }
                            else if (user.username === chat.un) {
                                return API.sendChat(subChat(cujothek9.chat.selfcookie, {name: name}));
                            }
                            else {
                                return API.sendChat(subChat(cujothek9.chat.cookie, {nameto: user.username, namefrom: chat.un, cookie: this.getCookie()}));
                            }
                        }
                    }
                }
            },

            cycleCommand: {
                command: 'cycle',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        cujothek9.roomUtilities.changeDJCycle();
                    }
                }
            },

            cycleguardCommand: {
                command: 'cycleguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.settings.cycleGuard) {
                            cujothek9.settings.cycleGuard = !cujothek9.settings.cycleGuard;
                            return API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.cycleguard}));
                        }
                        else {
                            cujothek9.settings.cycleGuard = !cujothek9.settings.cycleGuard;
                            return API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.cycleguard}));
                        }

                    }
                }
            },

            cycletimerCommand: {
                command: 'cycletimer',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var cycleTime = msg.substring(cmd.length + 1);
                        if (!isNaN(cycleTime) && cycleTime !== "") {
                            cujothek9.settings.maximumCycletime = cycleTime;
                            return API.sendChat(subChat(cujothek9.chat.cycleguardtime, {name: chat.un, time: cujothek9.settings.maximumCycletime}));
                        }
                        else return API.sendChat(subChat(cujothek9.chat.invalidtime, {name: chat.un}));

                    }
                }
            },

            dclookupCommand: {
                command: ['dclookup', 'dc'],
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substring(cmd.length + 2);
                            var perm = cujothek9.userUtilities.getPermission(chat.uid);
                            if (perm < 2) return API.sendChat(subChat(cujothek9.chat.dclookuprank, {name: chat.un}));
                        }
                        var user = cujothek9.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(cujothek9.chat.invaliduserspecified, {name: chat.un}));
                        var toChat = cujothek9.userUtilities.dclookup(user.id);
                        API.sendChat(toChat);
                    }
                }
            },


            deletechatCommand: {
                command: 'deletechat',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(cujothek9.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = cujothek9.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(cujothek9.chat.invaliduserspecified, {name: chat.un}));
                        for (var i = 1; i < cujothek9.room.chatMessages.length; i++) {
                          if (cujothek9.room.chatMessages[i].indexOf(user.id) > -1){
                            API.moderateDeleteChat(cujothek9.room.chatMessages[i][0]);
                            cujothek9.room.chatMessages[i].splice(0);
                          }
                        }
                        API.sendChat(subChat(cujothek9.chat.deletechat, {name: chat.un, username: name}));
                    }
                }
            },


            emojiCommand: {
                command: 'emoji',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var link = 'http://www.emoji-cheat-sheet.com/';
                        API.sendChat(subChat(cujothek9.chat.emojilist, {link: link}));
                    }
                }
            },

            englishCommand: {
                command: 'english',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if(chat.message.length === cmd.length) return API.sendChat('/me No user specified.');
                        var name = chat.message.substring(cmd.length + 2);
                        var user = cujothek9.userUtilities.lookupUserName(name);
                        if(typeof user === 'boolean') return API.sendChat('/me Invalid user specified.');
                        var lang = cujothek9.userUtilities.getUser(user).language;
                        var ch = '/me @' + name + ' ';
                        switch(lang){
                            case 'en': break;
                            case 'da': ch += 'Vær venlig at tale engelsk.'; break;
                            case 'de': ch += 'Bitte sprechen Sie Englisch.'; break;
                            case 'es': ch += 'Por favor, hable Inglés.'; break;
                            case 'fr': ch += 'Parlez anglais, s\'il vous plaît.'; break;
                            case 'nl': ch += 'Spreek Engels, alstublieft.'; break;
                            case 'pl': ch += 'Proszę mówić po angielsku.'; break;
                            case 'pt': ch += 'Por favor, fale Inglês.'; break;
                            case 'sk': ch += 'Hovorte po anglicky, prosím.'; break;
                            case 'cs': ch += 'Mluvte prosím anglicky.'; break;
                            case 'sr': ch += 'Молим Вас, говорите енглески.'; break;
                        }
                        ch += ' English please.';
                        API.sendChat(ch);
                    }
                }
            },

            etaCommand: {
                command: 'eta',
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var perm = cujothek9.userUtilities.getPermission(chat.uid);
                        var msg = chat.message;
                        var dj = API.getDJ().username;
                        var name;
                        if (msg.length > cmd.length) {
                            if (perm < 2) return void (0);
                            name = msg.substring(cmd.length + 2);
                        } else name = chat.un;
                        var user = cujothek9.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(cujothek9.chat.invaliduserspecified, {name: chat.un}));
                        var pos = API.getWaitListPosition(user.id);
                        var realpos = pos + 1;
                        if (name == dj) return API.sendChat(subChat(cujothek9.chat.youaredj, {name: name}));
                        if (pos < 0) return API.sendChat(subChat(cujothek9.chat.notinwaitlist, {name: name}));
                        if (pos == 0) return API.sendChat(subChat(cujothek9.chat.youarenext, {name: name}));
                        var timeRemaining = API.getTimeRemaining();
                        var estimateMS = ((pos + 1) * 4 * 60 + timeRemaining) * 1000;
                        var estimateString = cujothek9.roomUtilities.msToStr(estimateMS);
                        API.sendChat(subChat(cujothek9.chat.eta, {name: name, time: estimateString, position: realpos}));
                    }
                }
            },

            fbCommand: {
                command: 'fb',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof cujothek9.settings.fbLink === "string")
                            API.sendChat(subChat(cujothek9.chat.facebook, {link: cujothek9.settings.fbLink}));
                    }
                }
            },

            filterCommand: {
                command: 'filter',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.settings.filterChat) {
                            cujothek9.settings.filterChat = !cujothek9.settings.filterChat;
                            return API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.chatfilter}));
                        }
                        else {
                            cujothek9.settings.filterChat = !cujothek9.settings.filterChat;
                            return API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.chatfilter}));
                        }
                    }
                }
            },

            forceskipCommand: {
                command: ['forceskip', 'fs'],
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(subChat(cujothek9.chat.forceskip, {name: chat.un}));
                        API.moderateForceSkip();
                        cujothek9.room.skippable = false;
                        setTimeout(function () {
                            cujothek9.room.skippable = true
                        }, 5 * 1000);

                    }
                }
            },

            ghostbusterCommand: {
                command: 'ghostbuster',
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substr(cmd.length + 2);
                        }
                        var user = cujothek9.userUtilities.lookupUserName(name);
                        if (user === false || !user.inRoom) {
                            return API.sendChat(subChat(cujothek9.chat.ghosting, {name1: chat.un, name2: name}));
                        }
                        else API.sendChat(subChat(cujothek9.chat.notghosting, {name1: chat.un, name2: name}));
                    }
                }
            },

            gifCommand: {
                command: ['gif', 'giphy'],
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length !== cmd.length) {
                            function get_id(api_key, fixedtag, func)
                            {
                                $.getJSON(
                                    "https://tv.giphy.com/v1/gifs/random?",
                                    {
                                        "format": "json",
                                        "api_key": api_key,
                                        "rating": rating,
                                        "tag": fixedtag
                                    },
                                    function(response)
                                    {
                                        func(response.data.id);
                                    }
                                    )
                            }
                            var api_key = "dc6zaTOxFJmzC"; // public beta key
                            var rating = "pg-13"; // PG 13 gifs
                            var tag = msg.substr(cmd.length + 1);
                            var fixedtag = tag.replace(/ /g,"+");
                            var commatag = tag.replace(/ /g,", ");
                            get_id(api_key, tag, function(id) {
                                if (typeof id !== 'undefined') {
                                    API.sendChat(subChat(cujothek9.chat.validgiftags, {name: chat.un, id: id, tags: commatag}));
                                } else {
                                    API.sendChat(subChat(cujothek9.chat.invalidgiftags, {name: chat.un, tags: commatag}));
                                }
                            });
                        }
                        else {
                            function get_random_id(api_key, func)
                            {
                                $.getJSON(
                                    "https://tv.giphy.com/v1/gifs/random?",
                                    {
                                        "format": "json",
                                        "api_key": api_key,
                                        "rating": rating
                                    },
                                    function(response)
                                    {
                                        func(response.data.id);
                                    }
                                    )
                            }
                            var api_key = "dc6zaTOxFJmzC"; // public beta key
                            var rating = "pg-13"; // PG 13 gifs
                            get_random_id(api_key, function(id) {
                                if (typeof id !== 'undefined') {
                                    API.sendChat(subChat(cujothek9.chat.validgifrandom, {name: chat.un, id: id}));
                                } else {
                                    API.sendChat(subChat(cujothek9.chat.invalidgifrandom, {name: chat.un}));
                                }
                            });
                        }
                    }
                }
            },

            helpCommand: {
                command: 'help',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var link = "(Updated link coming soon)";
                        API.sendChat(subChat(cujothek9.chat.starterhelp, {link: link}));
                    }
                }
            },

            historyskipCommand: {
                command: 'historyskip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.settings.historySkip) {
                            cujothek9.settings.historySkip = !cujothek9.settings.historySkip;
                            API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.historyskip}));
                        }
                        else {
                            cujothek9.settings.historySkip = !cujothek9.settings.historySkip;
                            API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.historyskip}));
                        }
                    }
                }
            },

            joinCommand: {
                command: 'join',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.room.roulette.rouletteStatus && cujothek9.room.roulette.participants.indexOf(chat.uid) < 0) {
                            cujothek9.room.roulette.participants.push(chat.uid);
                            API.sendChat(subChat(cujothek9.chat.roulettejoin, {name: chat.un}));
                        }
                    }
                }
            },

            jointimeCommand: {
                command: 'jointime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(cujothek9.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = cujothek9.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(cujothek9.chat.invaliduserspecified, {name: chat.un}));
                        var join = cujothek9.userUtilities.getJointime(user);
                        var time = Date.now() - join;
                        var timeString = cujothek9.roomUtilities.msToStr(time);
                        API.sendChat(subChat(cujothek9.chat.jointime, {namefrom: chat.un, username: name, time: timeString}));
                    }
                }
            },

            kickCommand: {
                command: 'kick',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var lastSpace = msg.lastIndexOf(' ');
                        var time;
                        var name;
                        if (lastSpace === msg.indexOf(' ')) {
                            time = 0.25;
                            name = msg.substring(cmd.length + 2);
                        }
                        else {
                            time = msg.substring(lastSpace + 1);
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }

                        var user = cujothek9.userUtilities.lookupUserName(name);
                        var from = chat.un;
                        if (typeof user === 'boolean') return API.sendChat(subChat(cujothek9.chat.nouserspecified, {name: chat.un}));

                        var permFrom = cujothek9.userUtilities.getPermission(chat.uid);
                        var permTokick = cujothek9.userUtilities.getPermission(user.id);

                        if (permFrom <= permTokick)
                            return API.sendChat(subChat(cujothek9.chat.kickrank, {name: chat.un}));

                        if (!isNaN(time)) {
                            API.sendChat(subChat(cujothek9.chat.kick, {name: chat.un, username: name, time: time}));
                            if (time > 24 * 60 * 60) API.moderateBanUser(user.id, 1, API.BAN.PERMA);
                            else API.moderateBanUser(user.id, 1, API.BAN.DAY);
                            setTimeout(function (id, name) {
                                API.moderateUnbanUser(id);
                                console.log('Unbanned @' + name + '. (' + id + ')');
                            }, time * 60 * 1000, user.id, name);
                        }
                        else API.sendChat(subChat(cujothek9.chat.invalidtime, {name: chat.un}));
                    }
                }
            },

            killCommand: {
                command: 'kill',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        storeToStorage();
                        //sendToSocket();
                        API.sendChat(cujothek9.chat.kill);
                        cujothek9.disconnectAPI();
                        setTimeout(function () {
                            kill();
                        }, 1000);
                    }
                }
            },

            languageCommand: {
                command: 'language',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat(cujothek9.chat.currentlang, {language: cujothek9.settings.language}));
                        var argument = msg.substring(cmd.length + 1);

                        $.get("https://rawgit.com/cujothek9/source/master/lang/langIndex.json", function (json) {
                            var langIndex = json;
                            var link = langIndex[argument.toLowerCase()];
                            if (typeof link === "undefined") {
                                API.sendChat(subChat(cujothek9.chat.langerror, {link: "http://git.io/vJ9nI"}));
                            }
                            else {
                                cujothek9.settings.language = argument;
                                loadChat();
                                API.sendChat(subChat(cujothek9.chat.langset, {language: cujothek9.settings.language}));
                            }
                        });
                    }
                }
            },

            leaveCommand: {
                command: 'leave',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var ind = cujothek9.room.roulette.participants.indexOf(chat.uid);
                        if (ind > -1) {
                            cujothek9.room.roulette.participants.splice(ind, 1);
                            API.sendChat(subChat(cujothek9.chat.rouletteleave, {name: chat.un}));
                        }
                    }
                }
            },

            linkCommand: {
                command: 'link',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var media = API.getMedia();
                        var from = chat.un;
                        var user = cujothek9.userUtilities.lookupUser(chat.uid);
                        var perm = cujothek9.userUtilities.getPermission(chat.uid);
                        var dj = API.getDJ().id;
                        var isDj = false;
                        if (dj === chat.uid) isDj = true;
                        if (perm >= 1 || isDj) {
                            if (media.format === 1) {
                                var linkToSong = "https://youtu.be/" + media.cid;
                                API.sendChat(subChat(cujothek9.chat.songlink, {name: from, link: linkToSong}));
                            }
                            if (media.format === 2) {
                                SC.get('/tracks/' + media.cid, function (sound) {
                                    API.sendChat(subChat(cujothek9.chat.songlink, {name: from, link: sound.permalink_url}));
                                });
                            }
                        }
                    }
                }
            },

            lockCommand: {
                command: 'lock',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        cujothek9.roomUtilities.booth.lockBooth();
                    }
                }
            },

            lockdownCommand: {
                command: 'lockdown',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var temp = cujothek9.settings.lockdownEnabled;
                        cujothek9.settings.lockdownEnabled = !temp;
                        if (cujothek9.settings.lockdownEnabled) {
                            return API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.lockdown}));
                        }
                        else return API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.lockdown}));
                    }
                }
            },

            lockguardCommand: {
                command: 'lockguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.settings.lockGuard) {
                            cujothek9.settings.lockGuard = !cujothek9.settings.lockGuard;
                            return API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.lockguard}));
                        }
                        else {
                            cujothek9.settings.lockGuard = !cujothek9.settings.lockGuard;
                            return API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.lockguard}));
                        }
                    }
                }
            },

            lockskipCommand: {
                command: 'lockskip',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.room.skippable) {
                            var dj = API.getDJ();
                            var id = dj.id;
                            var name = dj.username;
                            var msgSend = '@' + name + ': ';
                            cujothek9.room.queueable = false;

                            if (chat.message.length === cmd.length) {
                                API.sendChat(subChat(cujothek9.chat.usedlockskip, {name: chat.un}));
                                cujothek9.roomUtilities.booth.lockBooth();
                                setTimeout(function (id) {
                                    API.moderateForceSkip();
                                    cujothek9.room.skippable = false;
                                    setTimeout(function () {
                                        cujothek9.room.skippable = true
                                    }, 5 * 1000);
                                    setTimeout(function (id) {
                                        cujothek9.userUtilities.moveUser(id, cujothek9.settings.lockskipPosition, false);
                                        cujothek9.room.queueable = true;
                                        setTimeout(function () {
                                            cujothek9.roomUtilities.booth.unlockBooth();
                                        }, 1000);
                                    }, 1500, id);
                                }, 1000, id);
                                return void (0);
                            }
                            var validReason = false;
                            var msg = chat.message;
                            var reason = msg.substring(cmd.length + 1);
                            for (var i = 0; i < cujothek9.settings.lockskipReasons.length; i++) {
                                var r = cujothek9.settings.lockskipReasons[i][0];
                                if (reason.indexOf(r) !== -1) {
                                    validReason = true;
                                    msgSend += cujothek9.settings.lockskipReasons[i][1];
                                }
                            }
                            if (validReason) {
                                API.sendChat(subChat(cujothek9.chat.usedlockskip, {name: chat.un}));
                                cujothek9.roomUtilities.booth.lockBooth();
                                setTimeout(function (id) {
                                    API.moderateForceSkip();
                                    cujothek9.room.skippable = false;
                                    API.sendChat(msgSend);
                                    setTimeout(function () {
                                        cujothek9.room.skippable = true
                                    }, 5 * 1000);
                                    setTimeout(function (id) {
                                        cujothek9.userUtilities.moveUser(id, cujothek9.settings.lockskipPosition, false);
                                        cujothek9.room.queueable = true;
                                        setTimeout(function () {
                                            cujothek9.roomUtilities.booth.unlockBooth();
                                        }, 1000);
                                    }, 1500, id);
                                }, 1000, id);
                                return void (0);
                            }
                        }
                    }
                }
            },

            locktimerCommand: {
                command: 'locktimer',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var lockTime = msg.substring(cmd.length + 1);
                        if (!isNaN(lockTime) && lockTime !== "") {
                            cujothek9.settings.maximumLocktime = lockTime;
                            return API.sendChat(subChat(cujothek9.chat.lockguardtime, {name: chat.un, time: cujothek9.settings.maximumLocktime}));
                        }
                        else return API.sendChat(subChat(cujothek9.chat.invalidtime, {name: chat.un}));
                    }
                }
            },

            logoutCommand: {
                command: 'logout',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(subChat(cujothek9.chat.logout, {name: chat.un, botname: cujothek9.settings.botName}));
                        setTimeout(function () {
                            $(".logout").mousedown()
                        }, 1000);
                    }
                }
            },

            maxlengthCommand: {
                command: 'maxlength',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var maxTime = msg.substring(cmd.length + 1);
                        if (!isNaN(maxTime)) {
                            cujothek9.settings.maximumSongLength = maxTime;
                            return API.sendChat(subChat(cujothek9.chat.maxlengthtime, {name: chat.un, time: cujothek9.settings.maximumSongLength}));
                        }
                        else return API.sendChat(subChat(cujothek9.chat.invalidtime, {name: chat.un}));
                    }
                }
            },

            motdCommand: {
                command: 'motd',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat('/me MotD: ' + cujothek9.settings.motd);
                        var argument = msg.substring(cmd.length + 1);
                        if (!cujothek9.settings.motdEnabled) cujothek9.settings.motdEnabled = !cujothek9.settings.motdEnabled;
                        if (isNaN(argument)) {
                            cujothek9.settings.motd = argument;
                            API.sendChat(subChat(cujothek9.chat.motdset, {msg: cujothek9.settings.motd}));
                        }
                        else {
                            cujothek9.settings.motdInterval = argument;
                            API.sendChat(subChat(cujothek9.chat.motdintervalset, {interval: cujothek9.settings.motdInterval}));
                        }
                    }
                }
            },

            moveCommand: {
                command: 'move',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(cujothek9.chat.nouserspecified, {name: chat.un}));
                        var firstSpace = msg.indexOf(' ');
                        var lastSpace = msg.lastIndexOf(' ');
                        var pos;
                        var name;
                        if (isNaN(parseInt(msg.substring(lastSpace + 1)))) {
                            pos = 1;
                            name = msg.substring(cmd.length + 2);
                        }
                        else {
                            pos = parseInt(msg.substring(lastSpace + 1));
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }
                        var user = cujothek9.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(cujothek9.chat.invaliduserspecified, {name: chat.un}));
                        if (user.id === cujothek9.loggedInID) return API.sendChat(subChat(cujothek9.chat.addbotwaitlist, {name: chat.un}));
                        if (!isNaN(pos)) {
                            API.sendChat(subChat(cujothek9.chat.move, {name: chat.un}));
                            cujothek9.userUtilities.moveUser(user.id, pos, false);
                        } else return API.sendChat(subChat(cujothek9.chat.invalidpositionspecified, {name: chat.un}));
                    }
                }
            },

            muteCommand: {
                command: 'mute',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(cujothek9.chat.nouserspecified, {name: chat.un}));
                        var lastSpace = msg.lastIndexOf(' ');
                        var time = null;
                        var name;
                        if (lastSpace === msg.indexOf(' ')) {
                            name = msg.substring(cmd.length + 2);
                            time = 45;
                        } else {
                            time = msg.substring(lastSpace + 1);
                            if (isNaN(time) || time == '' || time == null || typeof time == 'undefined'){
                                return API.sendChat(subChat(cujothek9.chat.invalidtime, {name: chat.un}));
                            }
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }
                        var from = chat.un;
                        var user = cujothek9.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(cujothek9.chat.invaliduserspecified, {name: chat.un}));
                        var permFrom = cujothek9.userUtilities.getPermission(chat.uid);
                        var permUser = cujothek9.userUtilities.getPermission(user.id);
                        if (permUser == 0) {
                            if (time > 45) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat(cujothek9.chat.mutedmaxtime, {name: chat.un, time: '45'}));
                            }
                            else if (time === 45) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat(cujothek9.chat.mutedtime, {name: chat.un, username: name, time: time}));
                            }
                            else if (time > 30) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat(cujothek9.chat.mutedtime, {name: chat.un, username: name, time: time}));
                            }
                            else if (time > 15) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.MEDIUM);
                                API.sendChat(subChat(cujothek9.chat.mutedtime, {name: chat.un, username: name, time: time}));
                            }
                            else {
                                API.moderateMuteUser(user.id, 1, API.MUTE.SHORT);
                                API.sendChat(subChat(cujothek9.chat.mutedtime, {name: chat.un, username: name, time: time}));
                            }
                        }
                        else API.sendChat(subChat(cujothek9.chat.muterank, {name: chat.un}));
                    }
                }
            },

            opCommand: {
                command: 'op',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof cujothek9.settings.opLink === "string")
                            return API.sendChat(subChat(cujothek9.chat.oplist, {link: cujothek9.settings.opLink}));
                    }
                }
            },

            pingCommand: {
                command: 'ping',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(cujothek9.chat.pong)
                    }
                }
            },

            refreshCommand: {
                command: 'refresh',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        //sendToSocket();
                        storeToStorage();
                        cujothek9.disconnectAPI();
                        setTimeout(function () {
                            window.location.reload(false);
                        }, 1000);

                    }
                }
            },

            reloadCommand: {
                command: 'reload',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(cujothek9.chat.reload);
                        //sendToSocket();
                        storeToStorage();
                        cujothek9.disconnectAPI();
                        kill();
                        setTimeout(function () {
                            $.getScript(cujothek9.settings.scriptLink);
                        }, 2000);
                    }
                }
            },

            removeCommand: {
                command: 'remove',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length > cmd.length + 2) {
                            var name = msg.substr(cmd.length + 2);
                            var user = cujothek9.userUtilities.lookupUserName(name);
                            if (typeof user !== 'boolean') {
                                user.lastDC = {
                                    time: null,
                                    position: null,
                                    songCount: 0
                                };
                                if (API.getDJ().id === user.id) {
                                    API.moderateForceSkip();
                                    setTimeout(function () {
                                        API.moderateRemoveDJ(user.id);
                                    }, 1 * 1000, user);
                                }
                                else API.moderateRemoveDJ(user.id);
                            } else API.sendChat(subChat(cujothek9.chat.removenotinwl, {name: chat.un, username: name}));
                        } else API.sendChat(subChat(cujothek9.chat.nouserspecified, {name: chat.un}));
                    }
                }
            },

            restrictetaCommand: {
                command: 'restricteta',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.settings.etaRestriction) {
                            cujothek9.settings.etaRestriction = !cujothek9.settings.etaRestriction;
                            return API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.etarestriction}));
                        }
                        else {
                            cujothek9.settings.etaRestriction = !cujothek9.settings.etaRestriction;
                            return API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.etarestriction}));
                        }
                    }
                }
            },

            rouletteCommand: {
                command: 'roulette',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (!cujothek9.room.roulette.rouletteStatus) {
                            cujothek9.room.roulette.startRoulette();
                        }
                    }
                }
            },

            rulesCommand: {
                command: 'rules',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof cujothek9.settings.rulesLink === "string")
                            return API.sendChat(subChat(cujothek9.chat.roomrules, {link: cujothek9.settings.rulesLink}));
                    }
                }
            },

            sessionstatsCommand: {
                command: 'sessionstats',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var from = chat.un;
                        var woots = cujothek9.room.roomstats.totalWoots;
                        var mehs = cujothek9.room.roomstats.totalMehs;
                        var grabs = cujothek9.room.roomstats.totalCurates;
                        API.sendChat(subChat(cujothek9.chat.sessionstats, {name: from, woots: woots, mehs: mehs, grabs: grabs}));
                    }
                }
            },

            skipCommand: {
                command: ['skip', 'smartskip'],
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.room.skippable) {

                            var timeLeft = API.getTimeRemaining();
                            var timeElapsed = API.getTimeElapsed();
                            var dj = API.getDJ();
                            var name = dj.username;
                            var msgSend = '@' + name + ', ';

                            if (chat.message.length === cmd.length) {
                                API.sendChat(subChat(cujothek9.chat.usedskip, {name: chat.un}));
                                if (cujothek9.settings.smartSkip && timeLeft > timeElapsed){
                                    cujothek9.roomUtilities.smartSkip();
                                }
                                else {
                                    API.moderateForceSkip();
                                }
                            }
                            var validReason = false;
                            var msg = chat.message;
                            var reason = msg.substring(cmd.length + 1);
                            for (var i = 0; i < cujothek9.settings.skipReasons.length; i++) {
                                var r = cujothek9.settings.skipReasons[i][0];
                                if (reason.indexOf(r) !== -1) {
                                    validReason = true;
                                    msgSend += cujothek9.settings.skipReasons[i][1];
                                }
                            }
                            if (validReason) {
                                API.sendChat(subChat(cujothek9.chat.usedskip, {name: chat.un}));
                                if (cujothek9.settings.smartSkip && timeLeft > timeElapsed){
                                    cujothek9.roomUtilities.smartSkip(msgSend);
                                }
                                else {
                                    API.moderateForceSkip();
                                    setTimeout(function () {
                                        API.sendChat(msgSend);
                                    }, 500);
                                }
                            }
                        }
                    }
                }
            },

            skipposCommand: {
                command: 'skippos',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var pos = msg.substring(cmd.length + 1);
                        if (!isNaN(pos)) {
                            cujothek9.settings.skipPosition = pos;
                            return API.sendChat(subChat(cujothek9.chat.skippos, {name: chat.un, position: cujothek9.settings.skipPosition}));
                        }
                        else return API.sendChat(subChat(cujothek9.chat.invalidpositionspecified, {name: chat.un}));
                    }
                }
            },

            songstatsCommand: {
                command: 'songstats',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.settings.songstats) {
                            cujothek9.settings.songstats = !cujothek9.settings.songstats;
                            return API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.songstats}));
                        }
                        else {
                            cujothek9.settings.songstats = !cujothek9.settings.songstats;
                            return API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.songstats}));
                        }
                    }
                }
            },

            sourceCommand: {
                command: 'source',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat('/me This bot was created by ' + botCreator + ', but is now maintained by ' + botMaintainer + ".");
                    }
                }
            },

            statusCommand: {
                command: 'status',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var from = chat.un;
                        var msg = '[@' + from + '] ';

                        msg += cujothek9.chat.afkremoval + ': ';
                        if (cujothek9.settings.afkRemoval) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';
                        msg += cujothek9.chat.afksremoved + ": " + cujothek9.room.afkList.length + '. ';
                        msg += cujothek9.chat.afklimit + ': ' + cujothek9.settings.maximumAfk + '. ';

                        msg += 'Bouncer+: ';
                        if (cujothek9.settings.bouncerPlus) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += cujothek9.chat.blacklist + ': ';
                        if (cujothek9.settings.blacklistEnabled) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += cujothek9.chat.lockguard + ': ';
                        if (cujothek9.settings.lockGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += cujothek9.chat.cycleguard + ': ';
                        if (cujothek9.settings.cycleGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += cujothek9.chat.timeguard + ': ';
                        if (cujothek9.settings.timeGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += cujothek9.chat.chatfilter + ': ';
                        if (cujothek9.settings.filterChat) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += cujothek9.chat.historyskip + ': ';
                        if (cujothek9.settings.historySkip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += cujothek9.chat.voteskip + ': ';
                        if (cujothek9.settings.voteSkip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += cujothek9.chat.cmddeletion + ': ';
                        if (cujothek9.settings.cmdDeletion) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += cujothek9.chat.autoskip + ': ';
                        if (cujothek9.settings.autoskip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        // TODO: Display more toggleable bot settings.

                        var launchT = cujothek9.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;
                        var since = cujothek9.roomUtilities.msToStr(durationOnline);
                        msg += subChat(cujothek9.chat.activefor, {time: since});

                        /*
                        // least efficient way to go about this, but it works :)
                        if (msg.length > 250){
                            firstpart = msg.substr(0, 250);
                            secondpart = msg.substr(250);
                            API.sendChat(firstpart);
                            setTimeout(function () {
                                API.sendChat(secondpart);
                            }, 300);
                        }
                        else {
                            API.sendChat(msg);
                        }
                        */

                        // This is a more efficient solution
                        if (msg.length > 250){
                            var split = msg.match(/.{1,250}/g);
                            for (var i = 0; i < split.length; i++) {
                                var func = function(index) {
                                    setTimeout(function() {
                                        API.sendChat("/me " + split[index]);
                                    }, 500 * index);
                                }
                                func(i);
                            }
                        }
                        else {
                            return API.sendChat(msg);
                        }
                    }
                }
            },

            swapCommand: {
                command: 'swap',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(cujothek9.chat.nouserspecified, {name: chat.un}));
                        var firstSpace = msg.indexOf(' ');
                        var lastSpace = msg.lastIndexOf(' ');
                        var name1 = msg.split('@')[1].trim();
                        var name2 = msg.split('@')[2].trim();
                        var user1 = cujothek9.userUtilities.lookupUserName(name1);
                        var user2 = cujothek9.userUtilities.lookupUserName(name2);
                        if (typeof user1 === 'boolean' || typeof user2 === 'boolean') return API.sendChat(subChat(cujothek9.chat.swapinvalid, {name: chat.un}));
                        if (user1.id === cujothek9.loggedInID || user2.id === cujothek9.loggedInID) return API.sendChat(subChat(cujothek9.chat.addbottowaitlist, {name: chat.un}));
                        var p1 = API.getWaitListPosition(user1.id) + 1;
                        var p2 = API.getWaitListPosition(user2.id) + 1;
                        if (p1 < 0 && p2 < 0) return API.sendChat(subChat(cujothek9.chat.swapwlonly, {name: chat.un}));
                        API.sendChat(subChat(cujothek9.chat.swapping, {'name1': name1, 'name2': name2}));
                        if (p1 === -1){
                            API.moderateRemoveDJ(user2.id);
                            setTimeout(function (user1, p2) {
                                cujothek9.userUtilities.moveUser(user1.id, p2, true);
                            }, 2000, user1, p2);
                        }
                        else if (p2 === -1){
                            API.moderateRemoveDJ(user1.id);
                            setTimeout(function (user2, p1) {
                                cujothek9.userUtilities.moveUser(user2.id, p1, true);
                            }, 2000, user2, p1);
                        }
                        else if (p1 < p2) {
                            cujothek9.userUtilities.moveUser(user2.id, p1, false);
                            setTimeout(function (user1, p2) {
                                cujothek9.userUtilities.moveUser(user1.id, p2, false);
                            }, 2000, user1, p2);
                        }
                        else {
                            cujothek9.userUtilities.moveUser(user1.id, p2, false);
                            setTimeout(function (user2, p1) {
                                cujothek9.userUtilities.moveUser(user2.id, p1, false);
                            }, 2000, user2, p1);
                        }
                    }
                }
            },

            themeCommand: {
                command: 'theme',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof cujothek9.settings.themeLink === "string")
                            API.sendChat(subChat(cujothek9.chat.genres, {link: cujothek9.settings.themeLink}));
                    }
                }
            },

            thorCommand: {
              command: 'thor',
              rank: 'user',
              type: 'exact',
              functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                      if (cujothek9.settings.thorCommand){
                        var id = chat.uid,
                              isDj = API.getDJ().id == id ? true : false,
                              from = chat.un,
                              djlist = API.getWaitList(),
                              inDjList = false,
                              oldTime = 0,
                              usedThor = false,
                              indexArrUsedThor,
                              thorCd = false,
                              timeInMinutes = 0,
                              worthyAlg = Math.floor(Math.random() * 10),
                              worthy = worthyAlg == 10 ? true : false;

                          for (var i = 0; i < djlist.length; i++) {
                              if (djlist[i].id == id)
                                  inDjList = true;
                          }

                          if (inDjList) {
                              for (var i = 0; i < cujothek9.room.usersUsedThor.length; i++) {
                                  if (cujothek9.room.usersUsedThor[i].id == id) {
                                      oldTime = cujothek9.room.usersUsedThor[i].time;
                                      usedThor = true;
                                      indexArrUsedThor = i;
                                  }
                              }

                              if (usedThor) {
                                  timeInMinutes = (cujothek9.settings.thorCooldown + 1) - (Math.floor((oldTime - Date.now()) * Math.pow(10, -5)) * -1);
                                  thorCd = timeInMinutes > 0 ? true : false;
                                  if (thorCd == false)
                                      cujothek9.room.usersUsedThor.splice(indexArrUsedThor, 1);
                              }

                              if (thorCd == false || usedThor == false) {
                                  var user = {id: id, time: Date.now()};
                                  cujothek9.room.usersUsedThor.push(user);
                              }
                          }

                          if (!inDjList) {
                              return API.sendChat(subChat(cujothek9.chat.thorNotClose, {name: from}));
                          } else if (thorCd) {
                              return API.sendChat(subChat(cujothek9.chat.thorcd, {name: from, time: timeInMinutes}));
                          }

                          if (worthy) {
                            if (API.getWaitListPosition(id) != 0)
                            cujothek9.userUtilities.moveUser(id, 1, false);
                            API.sendChat(subChat(cujothek9.chat.thorWorthy, {name: from}));
                          } else {
                            if (API.getWaitListPosition(id) != djlist.length - 1)
                            cujothek9.userUtilities.moveUser(id, djlist.length, false);
                            API.sendChat(subChat(cujothek9.chat.thorNotWorthy, {name: from}));
                          }
                        }
                    }
                }
            },

            timeguardCommand: {
                command: 'timeguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.settings.timeGuard) {
                            cujothek9.settings.timeGuard = !cujothek9.settings.timeGuard;
                            return API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.timeguard}));
                        }
                        else {
                            cujothek9.settings.timeGuard = !cujothek9.settings.timeGuard;
                            return API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.timeguard}));
                        }

                    }
                }
            },

            toggleblCommand: {
                command: 'togglebl',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var temp = cujothek9.settings.blacklistEnabled;
                        cujothek9.settings.blacklistEnabled = !temp;
                        if (cujothek9.settings.blacklistEnabled) {
                          return API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.blacklist}));
                        }
                        else return API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.blacklist}));
                    }
                }
            },

            togglemotdCommand: {
                command: 'togglemotd',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.settings.motdEnabled) {
                            cujothek9.settings.motdEnabled = !cujothek9.settings.motdEnabled;
                            API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.motd}));
                        }
                        else {
                            cujothek9.settings.motdEnabled = !cujothek9.settings.motdEnabled;
                            API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.motd}));
                        }
                    }
                }
            },

            togglevoteskipCommand: {
                command: 'togglevoteskip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.settings.voteSkip) {
                            cujothek9.settings.voteSkip = !cujothek9.settings.voteSkip;
                            API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.voteskip}));
                        }
                        else {
                            cujothek9.settings.voteSkip = !cujothek9.settings.voteSkip;
                            API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.voteskip}));
                        }
                    }
                }
            },

            unbanCommand: {
                command: 'unban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        $.getJSON('/_/bans', function (json){
                            var msg = chat.message;
                            if (msg.length === cmd.length) return;
                            var name = msg.substring(cmd.length + 2);
                            var bannedUsers = json.data;
                            var found = false;
                            var bannedUser = null;
                            for (var i = 0; i < bannedUsers.length; i++) {
                                var user = bannedUsers[i];
                                if (user.username === name) {
                                    bannedUser = user;
                                    found = true;
                                }
                            }
                            if (!found) return API.sendChat(subChat(cujothek9.chat.notbanned, {name: chat.un}));
                            API.moderateUnbanUser(bannedUser.id);
                            console.log('Unbanned:', name);
                        });
                    }
                }
            },

            unlockCommand: {
                command: 'unlock',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        cujothek9.roomUtilities.booth.unlockBooth();
                    }
                }
            },

            unmuteCommand: {
                command: 'unmute',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        $.getJSON('/_/mutes', function (json){
                            var msg = chat.message;
                            if (msg.length === cmd.length) return;
                            var name = msg.substring(cmd.length+2);
                            var arg = msg.substring(cmd.length+1);
                            var mutedUsers = json.data;
                            var found = false;
                            var mutedUser = null;
                            var permFrom = cujothek9.userUtilities.getPermission(chat.uid);
                            if (msg.indexOf('@') === -1 && arg === 'all'){
                                if (permFrom > 2){
                                    for (var i = 0; i < mutedUsers.length; i++){
                                        API.moderateUnmuteUser(mutedUsers[i].id);
                                    }
                                    API.sendChat(subChat(cujothek9.chat.unmutedeveryone, {name: chat.un}));
                                } else API.sendChat(subChat(cujothek9.chat.unmuteeveryonerank, {name: chat.un}));
                            } else {
                                for (var i = 0; i < mutedUsers.length; i++){
                                    var user = mutedUsers[i];
                                    if (user.username === name){
                                        mutedUser = user;
                                        found = true;
                                    }
                                }
                                if (!found) return API.sendChat(subChat(cujothek9.chat.notbanned, {name: chat.un}));
                                API.moderateUnmuteUser(mutedUser.id);
                                console.log('Unmuted:', name);
                            }
                        });
                    }
                }
            },

            usercmdcdCommand: {
                command: 'usercmdcd',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var cd = msg.substring(cmd.length + 1);
                        if (!isNaN(cd)) {
                            cujothek9.settings.commandCooldown = cd;
                            return API.sendChat(subChat(cujothek9.chat.commandscd, {name: chat.un, time: cujothek9.settings.commandCooldown}));
                        }
                        else return API.sendChat(subChat(cujothek9.chat.invalidtime, {name: chat.un}));
                    }
                }
            },

            usercommandsCommand: {
                command: 'usercommands',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.settings.usercommandsEnabled) {
                            API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.usercommands}));
                            cujothek9.settings.usercommandsEnabled = !cujothek9.settings.usercommandsEnabled;
                        }
                        else {
                            API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.usercommands}));
                            cujothek9.settings.usercommandsEnabled = !cujothek9.settings.usercommandsEnabled;
                        }
                    }
                }
            },

            voteratioCommand: {
                command: 'voteratio',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(cujothek9.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = cujothek9.userUtilities.lookupUserName(name);
                        if (user === false) return API.sendChat(subChat(cujothek9.chat.invaliduserspecified, {name: chat.un}));
                        var vratio = user.votes;
                        var ratio = vratio.woot / vratio.meh;
                        API.sendChat(subChat(cujothek9.chat.voteratio, {name: chat.un, username: name, woot: vratio.woot, mehs: vratio.meh, ratio: ratio.toFixed(2)}));
                    }
                }
            },

            voteskipCommand: {
                command: 'voteskip',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat(cujothek9.chat.voteskiplimit, {name: chat.un, limit: cujothek9.settings.voteSkipLimit}));
                        var argument = msg.substring(cmd.length + 1);
                        if (!cujothek9.settings.voteSkip) cujothek9.settings.voteSkip = !cujothek9.settings.voteSkip;
                        if (isNaN(argument)) {
                            API.sendChat(subChat(cujothek9.chat.voteskipinvalidlimit, {name: chat.un}));
                        }
                        else {
                            cujothek9.settings.voteSkipLimit = argument;
                            API.sendChat(subChat(cujothek9.chat.voteskipsetlimit, {name: chat.un, limit: cujothek9.settings.voteSkipLimit}));
                        }
                    }
                }
            },

            welcomeCommand: {
                command: 'welcome',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (cujothek9.settings.welcome) {
                            cujothek9.settings.welcome = !cujothek9.settings.welcome;
                            return API.sendChat(subChat(cujothek9.chat.toggleoff, {name: chat.un, 'function': cujothek9.chat.welcomemsg}));
                        }
                        else {
                            cujothek9.settings.welcome = !cujothek9.settings.welcome;
                            return API.sendChat(subChat(cujothek9.chat.toggleon, {name: chat.un, 'function': cujothek9.chat.welcomemsg}));
                        }
                    }
                }
            },

            websiteCommand: {
                command: 'website',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof cujothek9.settings.website === "string")
                            API.sendChat(subChat(cujothek9.chat.website, {link: cujothek9.settings.website}));
                    }
                }
            },

            whoisCommand: {
                command: 'whois',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substr(cmd.length + 2);
                        }
                        users = API.getUsers();
                        var len = users.length;
                        for (var i = 0; i < len; ++i){
                            if (users[i].username == name){
                                var id = users[i].id;
                                var avatar = API.getUser(id).avatarID;
                                var level = API.getUser(id).level;
                                var rawjoined = API.getUser(id).joined;
                                var joined = rawjoined.substr(0, 10);
                                var rawlang = API.getUser(id).language;
                                if (rawlang == "en"){
                                    var language = "English";
                                } else if (rawlang == "bg"){
                                    var language = "Bulgarian";
                                } else if (rawlang == "cs"){
                                    var language = "Czech";
                                } else if (rawlang == "fi"){
                                    var language = "Finnish"
                                } else if (rawlang == "fr"){
                                    var language = "French"
                                } else if (rawlang == "pt"){
                                    var language = "Portuguese"
                                } else if (rawlang == "zh"){
                                    var language = "Chinese"
                                } else if (rawlang == "sk"){
                                    var language = "Slovak"
                                } else if (rawlang == "nl"){
                                    var language = "Dutch"
                                } else if (rawlang == "ms"){
                                    var language = "Malay"
                                }
                                var rawrank = API.getUser(id).role;
                                if (rawrank == "0"){
                                    var rank = "User";
                                } else if (rawrank == "1"){
                                    var rank = "Resident DJ";
                                } else if (rawrank == "2"){
                                    var rank = "Bouncer";
                                } else if (rawrank == "3"){
                                    var rank = "Manager"
                                } else if (rawrank == "4"){
                                    var rank = "Co-Host"
                                } else if (rawrank == "5"){
                                    var rank = "Host"
                                } else if (rawrank == "7"){
                                    var rank = "Brand Ambassador"
                                } else if (rawrank == "10"){
                                    var rank = "Admin"
                                }
                                var slug = API.getUser(id).slug;
                                if (typeof slug !== 'undefined') {
                                    var profile = "https://plug.dj/@/" + slug;
                                } else {
                                    var profile = "~";
                                }

                                API.sendChat(subChat(cujothek9.chat.whois, {name1: chat.un, name2: name, id: id, avatar: avatar, profile: profile, language: language, level: level, joined: joined, rank: rank}));
                            }
                        }
                    }
                }
            },

            youtubeCommand: {
                command: 'youtube',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!cujothek9.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof cujothek9.settings.youtubeLink === "string")
                            API.sendChat(subChat(cujothek9.chat.youtube, {name: chat.un, link: cujothek9.settings.youtubeLink}));
                    }
                }
            }
        }
    };

    loadChat(cujothek9.startup);
}).call(this);

// isebella sux
