// beatmaps.js
export const beatmaps = {
    easy: [
        {
            name: "Perch", //1500
            bpm: 60,
            offset: 0,
            beats: [1, 2.3, 4.7, 5.7, 6.2, 7.4, 8.2, 8.6, 9, 10, 11.2, 11.5, 11.9, 12.3, 12.8],
            music: "audio/perch.mp3",
            fishImage: "/images/perch.png"
        },
        {
            name: "Clownfish", //1500
            bpm: 60,
            offset: 0,
            beats: [1.3, 2, 2.7, 3.5, 5, 5.6, 6.3, 8, 8.3, 10, 11, 12, 13, 13.7, 15.5],
            music: "audio/clownfish.mp3",
            fishImage: "/images/clownfish.png"
        },
        {
            name: "Bluegill", //1500
            bpm: 60,
            offset: 0,
            beats: [1.3, 2, 2.7, 3.5, 5, 5.6, 6.3, 8, 8.3, 10, 11, 12, 13, 13.7, 14],
            music: "audio/bluegill.mp3",
            fishImage: "/images/bluegill.png"
        },
        {
            name: "Pike",
            bpm: 60,
            offset: 0,
            beats: [0.8, 1.2, 1.4, 2, 2.2, 4, 4.3, 7.3, 8, 9, 10, 11, 12, 13, 13.2, 13.5, 14.3, 15, 15.5, 15.8, 16.3, 17, 18, 19, 20, 21],
            music: "audio/pike.mp3",
            fishImage: "/images/pike.png"
        }
    ],
    medium: [
        { name: "Rolling Tide", bpm: 80, offset: 0, beats: [1, 2, 2.5, 3.3, 4, 5.2], music: "audio/rolling_tide.mp3" },
        { name: "Fishing Frenzy", bpm: 90, offset: 0, beats: [0.5, 1.8, 2.6, 3.1, 4.3, 5.5], music: "audio/fishing_frenzy.mp3" }
    ],
    hard: [
        { name: "Shark Attack", bpm: 120, offset: 0, beats: [0.5, 1, 1.5, 2, 2.5, 3, 4], music: "audio/shark_attack.mp3" },
        { name: "River Rage", bpm: 130, offset: 0, beats: [0.5, 1.3, 2.1, 3.4, 4.8, 5.1], music: "audio/river_rage.mp3" }
    ]
};
