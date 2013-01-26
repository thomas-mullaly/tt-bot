(function () {
    var RESPONSES = [
        "I love the great despisers, because they are the great adorers, and arrows of longing for the other shore.",
        "I love those who do not first seek a reason beyond the stars for going down and being sacrifices, but sacrifice themselves to the earth, that the earth of the Superman may hereafter arrive.",
        "A little poison now and then: that maketh pleasant dreams. And much poison at last for a pleasant death.",
        "THREE metamorphoses of the spirit do I designate to you: how the spirit becometh a camel, the camel a lion, and the lion at last a child.",
        "Oh, that soul was itself meagre, ghastly, and famished; and cruelty was the delight of that soul!",
        "/tableflip",
        "My brethren, wherefore is there need of the lion in the spirit? Why sufficeth not the beast of burden, which renounceth and is reverent?",
        "Intoxicating joy is it for the sufferer to look away from his suffering and forget himself. Intoxicating joy and self-forgetting, did the world once seem to me.",
        "WHEN Zarathustra was thirty years old, he left his home and the lake of his home, and went into the mountains. There he enjoyed his spirit and his solitude, and for ten years did not weary of it. But at last his heart changed,- and rising one morning with the rosy dawn, he went before the sun, and spake thus unto it: undefined",
        "When Zarathustra arrived at the nearest town which adjoineth the forest, he found many people assembled in the market-place; for it had" +
            " been announced that a rope-dancer would give a performance. And Zarathustra spake thus unto the people: I teach you the Superman. Man is something that is to be" +
            " surpassed. What have ye done to surpass man? All beings hitherto have created something beyond themselves:",
        "What is the ape to man? A laughing-stock, a thing of shame. And just the same shall man be to the Superman: a laughing-stock, a thing of" +
            " shame. Ye have made your way from the worm to man, and much within you is still worm. Once were ye apes, and even yet man is more of an ape than" +
            " any of the apes. Even the wisest among you is only a disharmony and hybrid of plant"
    ];

    var madness = function (data, ttApi, botConfig) {
        var NO_MADNESS_PROBABILITY = 20;
        var LEAVE_PROBABILITY = 4;

        var madness = Math.floor(Math.random() * NO_MADNESS_PROBABILITY);

        if (madness !== 1) {
            var response = Math.floor(Math.random() * RESPONSES.length);

            ttApi.speak(RESPONSES[response]);
        } else {
            ttApi.speak("no");
        }

        var rage = Math.floor(Math.random() * LEAVE_PROBABILITY);
        if (rage !== 1) {
            // This is a testament to all terrible software. Through you lies true madness.
            setTimeout(function () {
                ttApi.speak("he comes! he comes! do not fi​ght, he com̡e̶s, ̕h̵i​s un̨ho͞ly radiańcé destro҉ying all enli̍̈́̂̈́ghtenment!");
                setTimeout(function () {
                    ttApi.roomDeregister();

                    setTimeout(function () {
                        ttApi.roomRegister(botConfig.bot.roomid);

                        var roomChanged = function (data) {
                            setTimeout(function () {
                                ttApi.speak("O_O");
                                ttApi.pm("/narwhal", botConfig.bot.credentials.userid);
                            }, 1500);
                        };
                        ttApi.once("roomChanged", roomChanged);
                    }, 10000);
                }, 750);
            }, 4000);
        }
    };

    exports.attachCommandHandler = function (commandsModule, ttApi, botConfig) {
        commandsModule.registerCommandHandler({ botSpecific: true, command: "madness" },
            function (data, ttApi) {
                madness(data, ttApi, botConfig);
            });
    };
})();