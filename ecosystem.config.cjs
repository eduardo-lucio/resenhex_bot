module.exports = {
    apps: [
        {
            name: "resenhex_bot",
            script: "./dist/bot.js",
            instances: 1,
            autorestart: true,
            watch: false,
            restart_delay: 4000,
            max_memory_restart: "500M",
            env: {
                NODE_ENV: "production"
            }
        }
    ]
};