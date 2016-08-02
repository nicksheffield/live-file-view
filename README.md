# Live File View

Display the contents of a folder in a webpage that can be accessed by other computers on your local network.

I created this so that my students could explore the files in any project we are working on at their own pace.

To run it, you need to open the terminal, navigate to the folder you want to display, and run the node server.

Note that you need to run `npm install` before it will work.

To run the node server I generally set up an alias like this.

```
$ alias live="node ~/Sites/live-file-view/"
```

Then when I want to run live file view, I do

```
$ cd ~/Desktop/My-Project
$ live
```