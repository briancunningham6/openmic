module.exports = function(grunt) {
// Project configuration.
    grunt.initConfig({
        express: {
            options: {
                // Override defaults here
                background: falsegrunt
            },
            dev: {
                options: {
                    script: 'server.js'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-express-server');
    grunt.registerTask('default', ['express:dev']);

};
