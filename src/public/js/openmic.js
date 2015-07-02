/**
 * Created by Brian Cunningham
 * User: user
 * Date: 02/07/15
 * Time: 17:37
 */

//var apiKey = "45276662"; // Replace with your API key. See https://dashboard.tokbox.com/projects
//var sessionId = "2_MX40NTI3NjY2Mn5-MTQzNTg0NjAzMjAyNn5Qc3NVQnVhUk40R1RRMjRRTkJnQjVCUjB-fg"; // Replace with your own session ID. See https://dashboard.tokbox.com/projects
//var token = "T1==cGFydG5lcl9pZD00NTI3NjY2MiZzaWc9OTNlZTQzZGY3NTMyZGZmYzJmZjM3ZjFjNDBiZDBiMjJlNGU1ODZmZTpyb2xlPXB1Ymxpc2hlciZzZXNzaW9uX2lkPTJfTVg0ME5USTNOalkyTW41LU1UUXpOVGcwTmpBek1qQXlObjVRYzNOVlFuVmhVazQwUjFSUk1qUlJUa0puUWpWQ1VqQi1mZyZjcmVhdGVfdGltZT0xNDM1ODQ2MDM1Jm5vbmNlPTAuOTIwODQ5MzQwNzMyOTg5MyZleHBpcmVfdGltZT0xNDM4NDM4MDI0JmNvbm5lY3Rpb25fZGF0YT0=" ;  // Replace with a generated token. See https://dashboard.tokbox.com/projects

var session;
var publisher;

var VIDEO_WIDTH = 361;
var VIDEO_HEIGHT = 347;


var _selfstream;
var  subscribers = new Array();
var _streams = new Array();
var _connections = new Array();

function connect() {
    OT.on("exception", exceptionHandler);

    // Un-comment the following to set automatic logging:
    OT.setLogLevel(OT.DEBUG);

    if (!(OT.checkSystemRequirements())) {
        alert("You don't have the minimum requirements to run this application.");
    } else {
        session = OT.initSession(sessionId);	// Initialize session
        session.connect(apiKey, token);
        // Add event listeners to the session

        session.on('sessionConnected', sessionConnectedHandler);
        session.on('sessionDisconnected', sessionDisconnectedHandler);
        session.on('connectionCreated', connectionCreatedHandler);
        session.on('connectionDestroyed', connectionDestroyedHandler);
        session.on('streamCreated', streamCreatedHandler);
        session.on('streamDestroyed', streamDestroyedHandler);
        session.on("signal", signalEventHandler);

    }
}

function disconnect() {
    stopPublishing();
    session.disconnect() ;

    hide('disconnectLink');

}

// Called when user wants to start publishing to the session
function startPublishing() {
    if (!publisher) {
        var name= document.getElementById("txtName").value;
        var parentDiv = document.getElementById("myCamera");
        var publisherDiv = document.createElement('div'); // Create a div for the publisher to replace
        publisherDiv.setAttribute('id', 'opentok_publisher');
        parentDiv.appendChild(publisherDiv);
        var publisherProps = {width: VIDEO_WIDTH, height: VIDEO_HEIGHT, name: name};
        publisher = OT.initPublisher(apiKey, publisherDiv.id, publisherProps);  // Pass the replacement div id and properties
        session.publish(publisher);
        publisher.on("streamCreated", function (event) {  //access the self video
            _selfstream = event.stream;
        });

    }
}

function stopPublishing() {
    if (publisher) {
        session.unpublish(publisher);
    }
    publisher = null;


}


function sessionConnectedHandler(event) {

    startPublishing();
    show('disconnectLink');
    hide('connectLink');
}

function streamCreatedHandler(event) {


    addButton(event.stream);                         //add call button when a new user comes online

}

function addButton( selectedStream) {


    if (! document.getElementById("btn_" + selectedStream.streamId))
    {
        var button = document.createElement("input");
        var buttonContainer= document.getElementById("onlineusers");

        button.setAttribute("id", "btn_" + selectedStream.streamId);
        button.setAttribute("type", "button");
        button.setAttribute("value", "Call " + selectedStream.name.toString());
        button.setAttribute("onclick", "beginCall(this)");
        buttonContainer.appendChild(button);
        buttonContainer.appendChild(document.createElement("br"));
        _streams[selectedStream.streamId] = selectedStream;
    }
}
function removeButton(selectedStream) {

    var btn = document.getElementById("btn_" + selectedStream.streamId)
    var buttonContainer = document.getElementById("onlineusers");
    delete _streams[selectedStream.streamId];
    if (btn) {
        buttonContainer.removeChild(btn);

    }
}

function removeAllButtons()
{
    var buttonContainer = document.getElementById("onlineusers");
    buttonContainer.innerHTML = '';
}

function endCall(obj, label) {

    console.log("endcall called");
    console.log(obj.value);
    _stream = _streams[obj.id.replace("btn_", "")];
    obj.value = label;
    obj.setAttribute("onclick", "beginCall(this)");
    removeStream(_stream);
    session.signal({
            type: "endcall",
            to:  _stream.connection,
            data: { streamId: _selfstream.streamId+"|"+_selfstream.name }
        },
        function (error) {
            if (error) {
                console.log("signal error: " + error.reason);
            } else {
                console.log("signal sent");
            }
        }
    );
}

function beginCall(obj) {


    console.log(obj.value);

    obj.setAttribute("onclick", "endCall(this,'" + obj.value + "')");
    obj.value = 'End Call';
    _stream = _streams[obj.id.replace("btn_", "")];


    var streamNames = _stream.name.toString();



    session.signal({
            type: "begincall",
            to: _stream.connection,
            data: { streamId: _selfstream.streamId + "|" + _selfstream.name }
        },
        function (error) {
            if (error) {
                console.log("signal error: " + error.reason);
            } else {
                console.log("signal sent: begincall:");
            }
        }
    );
}


function signalEventHandler(event) {


    if (event.type == "signal:begincall") {

        //***************************Call Begin*********************************//

        data = event.data.streamId.toString().split('|');
        _streamId = data[0];
        _name = data[1];

        document.getElementById('acceptCallBox').style.display = 'block';
        //document.getElementById('acceptCallLabel').innerHTML = 'Incomming call from ' + _name;

        document.getElementById('acceptCallBox').innerHTML = document.getElementById('acceptCallBox').innerHTML +
            '<div id="callRequest"><div id="acceptCallLabel">Incomming call from ' + _name + '</div><input type="button" class="callAcceptButton" value="Accept" stream="' + _streamId + '"/><input type="button" class="callRejectButton" value="Reject" stream="' + _streamId + '"/></div>';


        //***************************Accept Call*************************************//
        var acceptButtons= document.getElementsByClassName('callAcceptButton');
        for(var i=0;i<acceptButtons.length;i++) {
            acceptButtons[i].addEventListener("click", function () {

                //document.getElementById('acceptCallBox').style.display = 'none';
                //document.getElementById('acceptCallLabel').innerHTML = '';
                _streamId = this.attributes.stream.value;

                _btn = document.getElementById('btn_' + _streamId);
                _btn.setAttribute("onclick", "endCall(this,'" + _btn.value + "')");
                _btn.value = 'End Call';

                addStream(_streams[_streamId]);
                session.signal({
                        type: "acceptcall",
                        to: _streams[_streamId].connection,
                        data: {callaccepted: _selfstream.streamId + "|" + _selfstream.name + "|yes"}
                    },
                    function (error) {
                        if (error) {
                            console.log("signal error: " + error.reason);
                        }
                        else {
                            console.log("signal sent");
                        }
                    }
                );
            });
        }

        //***************************Accept Call*************************************//

        //***************************Reject Call*************************************//
        var rejectButtons= document.getElementsByClassName('callRejectButton');
        for(var i=0;i<acceptButtons.length;i++) {
            rejectButtons[i].addEventListener("click", function () {
                _streamId = this.attributes.stream.value;

                this.parentElement.remove();

                session.signal({
                        type: "acceptcall",
                        to: _streams[_streamId].connection,
                        data: { callaccepted: _selfstream.streamId + "|" + _selfstream.name + "|no" }
                    },
                    function (error) {
                        if (error) { console.log("signal error: " + error.reason); }
                        else { console.log("signal sent"); }
                    }
                );
            });
        }

        //document.getElementById('callRejectButton').onclick = function () {
        //    document.getElementById('acceptCallBox').style.display = 'none';
        //    document.getElementById('acceptCallLabel').innerHTML = '';
        //
        //    session.signal({
        //        type: "acceptcall",
        //        to: _streams[_streamId].connection,
        //        data: { callaccepted: _selfstream.streamId + "|" + _selfstream.name + "|no" }
        //    },
        //            function (error) {
        //                if (error) { console.log("signal error: " + error.reason); }
        //                else { console.log("signal sent"); }
        //            }
        //        );
        //}
        //***************************Reject Call*************************************//
        //***************************Call Begin*********************************//
    }
    else if (event.type == "signal:acceptcall") {

        data = event.data.callaccepted.toString().split('|');
        _streamId = data[0];
        _name = data[1];
        _callaccepted = data[2];

        if (_callaccepted == 'yes') {

            addStream(_streams[_streamId]);
        }


        else


        if (_callaccepted == 'no') {
            document.querySelectorAll('[stream$="b27cea04-c05a-4ec5-b183-b63d8c25bae6"]')[0].parentElement.remove();
            alert('Call rejected by ' + _name);
            document.getElementById("btn_" + _streamId).click();
        }
    }

    else if (event.type == "signal:endcall") {

        document.querySelectorAll('[stream$="b27cea04-c05a-4ec5-b183-b63d8c25bae6"]')[0].parentElement.remove();

        data = event.data.streamId.toString().split("|");
        _streamId = data[0];

        removeStream(_streams[_streamId]);
        _btn = document.getElementById('btn_' + _streamId);
        _btn.setAttribute("onclick", "beginCall(this)");
        _btn.value = 'Call ' + data[1];



    }

}

function streamDestroyedHandler(event) {
    // This signals that a stream was destroyed. Any Subscribers will automatically be removed.
    // This default behaviour can be prevented using event.preventDefault()
    removeButton(event.stream);
}

function sessionDisconnectedHandler(event) {
    // This signals that the user was disconnected from the Session. Any subscribers and publishers
    // will automatically be removed. This default behaviour can be prevented using event.preventDefault()

    session.off('sessionConnected', sessionConnectedHandler);
    session.off('streamCreated', streamCreatedHandler);
    session.off('streamDestroyed', streamDestroyedHandler);
    session.off('connectionCreated', connectionCreatedHandler);
    session.off("signal", signalEventHandler);
    OT.off("exception", exceptionHandler);
    session.off('sessionDisconnected', sessionDisconnectedHandler);
    publisher = null;
    removeAllButtons();
    show('connectLink');
    hide('disconnectLink');

}



function connectionDestroyedHandler(event) {
    // This signals that connections were destroyed
}

function connectionCreatedHandler(event) {
    // This signals new connections have been created.
}

/*
 If you un-comment the call to OT.setLogLevel(), above, OpenTok automatically displays exception event messages.
 */
function exceptionHandler(event) {
    alert("Exception: " + event.code + "::" + event.message);
}

//--------------------------------------
//  HELPER METHODS
//--------------------------------------

function addStream(stream) {
    // Check if this is the stream that I am publishing, and if so do not publish.
    if (stream.connection.connectionId == session.connection.connectionId) {
        return;
    }
    var subscriberDiv = document.createElement('div'); // Create a div for the subscriber to replace
    subscriberDiv.setAttribute('id', stream.streamId); // Give the replacement div the id of the stream as its id.
    document.getElementById("subscribers").appendChild(subscriberDiv);
    var subscriberProps = {width: VIDEO_WIDTH, height: VIDEO_HEIGHT};
    subscribers[stream.streamId] = session.subscribe(stream, subscriberDiv.id, subscriberProps);
}


function removeStream(stream)
{
    session.unsubscribe(subscribers[stream.streamId]);
}
function show(id) {
    document.getElementById(id).style.display = 'block';
}

function hide(id) {
    document.getElementById(id).style.display = 'none';
}

