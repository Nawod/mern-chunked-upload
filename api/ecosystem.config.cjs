module.exports = {
     apps: [
       {
         name: 'file-upload-test',
         script: 'server.js',
         instances: 1,
         autorestart: true,
         watch: false,
         max_memory_restart: '1G',
         env: {
	   PORT: 4001,
           NODE_ENV: 'development',
         },
       },
     ],
   };
