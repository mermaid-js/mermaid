# New diagram type: network topology

**Author:** cristeab

**Created at:** 2020-01-28T13:50:26Z

**URL:** https://github.com/mermaid-js/mermaid/issues/1227

## Description

**Is your feature request related to a problem? Please describe.**
I need to create simple network topologies for testing frameworks involving multiple VMs and switches.

**Describe the solution you'd like**
Simple diagrams showing network connections between the VMs and switches, see this link for some samples: https://github.com/Azure/sonic-mgmt/blob/master/ansible/doc/README.testbed.Topology.md

**Describe alternatives you've considered**
Alternatives for this approach are editing by hand using any image editor that supports drawing rectangles and lines.




## Comments

### azawawi commented on 2020-02-06T22:52:42Z

@cristeab Do you have more ideas/examples for this one? I am willing to help out as I need this one as well.

### gildasio commented on 2020-02-12T14:22:06Z

It would be so nice!!

@azawawi I think that something similar to flowchart as a notation like this:

```
graph TD;
    Router---Switch1;
    Router---Switch2;
    Switch1---Server;
    Switch2---Server;
```

Generate something like this:

![image](https://user-images.githubusercontent.com/6231305/74343227-81195200-4d89-11ea-8d30-b452f70b95c1.png)

This image above I created with LibreOffice and [VRT extension](https://extensions.libreoffice.org/extensions/vrt-network-equipment).

### andrejpk commented on 2020-02-14T17:45:21Z

It would be useful for cloud situations to allow including some network context (e.g. VNet/VPC). This could be done with indentation like how State diagrams show nexted states.

Also including IP addresses and other metadata is important for some situations. Markup/notes would also be important it some diagrams. 

### andrejpk commented on 2020-02-14T17:52:52Z


```
networkDiagram
    network: vpc1
        node router
            type router
            meta ip=192.138.33.1
        node switch1
            type switch
            meta model=hp1234
        node switch2
            type switch
            meta model=cisco4321
            meta ip=192.168.33.2
        node server
            type server
           meta os=linux
        router---switch1
        router---switch2
        switch2---server: primary
        switch1---server: secondary
```

### cristeab commented on 2020-02-14T18:09:11Z

@azawawi I am thinking at something more detailed, like showing how the physical ports of each switch / network device are connected:

networkDiagram
link:
  startDevice: str-msn2700-01
  startPort: Ethernet0
  endDevice: str-7260-10
  endPort: Ethernet1
  bandwidth: 40000
  vlanId: 1681
  vlanMode: access
link:
  startDevice: str-7260-11
  startPort: Ethernet30
  endDevice: str-7260-10
  endPort: Ethernet64
  bandwidth: 40000
  vlanId: 1681-1712
  vlanMode: trunk

This is very useful to represent graphically a testbed network topology when developing/testing software for switches: https://github.com/Azure/sonic-mgmt/blob/master/ansible/files/sonic_lab_links.csv

### andrejpk commented on 2020-02-17T01:00:00Z

I think it would better to let the user add arbitrary name/value details instead of trying to think of and standardize every kind of metadata.

Maybe have two ways to define meta; a short line-liner or a list of name=value pairs:

```
networkDiagram
    network: vpc1
        node router
            type router
            meta ip=192.138.33.1
        node switch1
            type switch
            meta model=hp1234
        node switch2
            type switch
            meta:
                model=cisco4321
                ip=192.168.33.2
        node server
            type server
            meta os=linux
        router---switch1
        router---switch2
        switch2---server: primary
        switch1---server: secondary
```

### jgreywolf commented on 2020-02-17T17:49:32Z

Can someone provide another example of how something like this would look?  I am not seeing how the examples shared in the first post are different than using flowchart, kind of like:...

Actually, forget that part.  I tried to do this using flowcharts, both with and without a subgraph, and while it _sort of worked_, it did not look very nice



### jgreywolf commented on 2020-02-17T17:49:56Z

Sorry - wrong button

### meshula commented on 2020-02-17T19:18:50Z

In case it gives you ideas, I wrote this for my own use - https://github.com/meshula/Wires - it's got an extensive vocabulary and rule set for parsing graphs and attributes, documented in the readme. Here's some samples:

```
#define TEST1 "\
trivial ---> trivial2 \n\
foo ------->bar"

#define TEST2 "\
trivial ---+                  \n\
           |                  \n\
           )                  \n\
           +---->   trivial2"

#define TEST3 "          \n\
foo -------+             \n\
trivial1 --)-->trivial2  \n\
           +->     bar   "

#define TEST4 "\
sample0 ---------+                 \n\
sample1 -----+   |                 \n\
sample2 -----)---)----->output2    \n\
             +---)----->output1    \n\
                 |                 \n\
                 +--->output0     "

#define TEST5 "\
sample --+                                                                                           \n\
         +-> bassFilter ---> bassGain --------+                                                      \n\
         +-> midFilter ----> midGain ---------+                                                      \n\
         +-> trebleFilter ----> trebleGain ---+---> gain -+---> recorder ------+                     \n\
                                                          +---> monitor  ------+---> oscilloscope    \n\
                                                          +---> analyser                             \n\
                                                          +---> audiocontext                         "


#define TEST6 "\
[buffer:sample] ----------+                                                                                           \n\
  file:'human-voice.mp4'  |                                                                                             \n\
                          +-> [filter:bassFilter] ---> [gain:bassGain] --------+                                        \n\
                          |        type:'lowpass'          gain:2.0            |                                        \n\
                          |   frequency:160                                    |                                        \n\
                          |           q:1.2                                    |                                        \n\
                          +-> [filter:midFilter] ----> [gain:midGain] ---------+                                        \n\
                          |        type:'bandpass'          gain:4.0           |                                        \n\
                          |   frequency:500                                    |                                        \n\
                          |           q:1.2                                    |                                        \n\
                          +-> [filter:trebleFilter] ----> [gain:trebleGain] ---+---> gain -----+---> recorder           \n\
                                type:'highpass'            gain:3.0                  gain:1.0  +---> monitor            \n\
                           frequency:2000                                                      +---> oscilloscope       \n\
                                   q:1.2                                                       +---> analyser           \n\
                                                                                               +---> audiocontext         "

```

### mvandermade commented on 2020-02-22T18:34:26Z

So you just want to put a picture/icon instead of a box ?

Tip:
You could also use fontawesome icons and shapes:
<img width="653" alt="image" src="https://user-images.githubusercontent.com/33425497/75097357-3f1eb600-55aa-11ea-9188-e03b2282c5f8.png">

https://mermaid-js.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoiZ3JhcGggVERcbiAgQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG4gIEMgLS0-fE9uZXwgRFtMYXB0b3BdXG4gIEMgLS0-fFR3b3wgRVtpUGhvbmVdXG4gIEMgLS0-fFRocmVlfCBGWyhmYTpmYS1kYXRhYmFzZSBEYXRhYmFzZSldXG5cdFx0IiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifSwidXBkYXRlRWRpdG9yIjpmYWxzZX0

### jgroom33 commented on 2020-02-23T03:27:02Z

#806 

### jgroom33 commented on 2020-02-23T15:01:16Z

@azawawi

There are a few libraries that do something similar. They seem to be standardizing on cloud provider icon sets.

This one seems to be the closest to the design goals of mermaid:
https://diagrams.mingrammer.com/docs/getting-started/examples

This one provides the greatest flexibility, but is more complex:
http://go.drawthe.net/


### azawawi commented on 2020-03-06T02:25:38Z

Sample PlantUML nwdiag-based previous work with syntax:

https://plantuml.com/nwdiag

![image](https://s.plantuml.com/imgw/nwdiag-rcygmmmo.png)


### luiscachog commented on 2020-04-19T05:21:48Z

+1 on this idea.

### butterflyx commented on 2020-04-19T10:21:34Z

Also +1 from me for this idea.

andrejpk nailed it for me with this kind of syntax:
> ```
> networkDiagram
>     network: vpc1
>         node router
>             type router
>             meta ip=192.138.33.1
>         node switch1
>             type switch
>             meta model=hp1234
>         node switch2
>             type switch
>             meta:
>                 model=cisco4321
>                 ip=192.168.33.2
>         node server
>             type server
>             meta os=linux
>         router---switch1
>         router---switch2
>         switch2---server: primary
>         switch1---server: secondary
> ```

@mvandermade : yes, fontawesome might help, but it will never be the same beauty as in the example image gildasio provided

### scotho3 commented on 2020-08-18T19:40:54Z

I commented on #1527 for the same issue - this is exclusively what I use mermaid for - making network documentation, but I have to leave out some connections and draw them by hand (still faster than vizio). 

The amount of automated diagrams I could draw with this!

### xeor commented on 2021-02-16T12:59:05Z

What would be the best way to create network-diagrams while we wait for this? Something that also contains meta-info like ip-addresses and ip/port info..

### jgroom33 commented on 2021-02-16T14:25:46Z

@xeor I've settled on using drawio. There's a plug-in for vscode. The files can be saved as foo.drawio.svg or foo.drawio.png and rendered in markdown.

### go2null commented on 2021-05-25T19:20:46Z

really need this for drawing a multi-interface server -> example, on a back-channel and front-channel.

### krkn-s commented on 2021-06-01T07:55:24Z

Hello,
I just discovered this open source tool that allows you to make network diagrams from a YAML : http://go.drawthe.net

Hopefully it meets your needs until MermaidJS is able to make network diagrams too.

### justyn commented on 2021-09-16T13:49:47Z

I would just add to the syntax discussion that it would ideally be possible to label an IP address per connection line in nodes that have multiple interfaces (routers etc).

I think there are basically two ways per-interface IP address can be added visually:

1) Label within the node at the point the connection line meets the node
2) Use two labels per connection line - one at each end, indicating the IP of the node at that end.

A random example from the internet of the first approach, in the central node:

![an-0001-en-configuring-an-ip_1_new](https://user-images.githubusercontent.com/203419/133623148-689da002-ddb2-430d-96db-5eb7ccbf2a70.png)




### aronchick commented on 2022-02-09T19:26:43Z

One thing to add to the great discussion here - is there the ability to have icons attached to nodes? The networking logos are quite good, and having a simple way to swap out a default node picture for a URL would be great

### andrejpk commented on 2022-02-10T04:49:19Z

> One thing to add to the great discussion here - is there the ability to have icons attached to nodes? The networking logos are quite good, and having a simple way to swap out a default node picture for a URL would be great

Agree... a URL or relative file reference

### xu4wang commented on 2022-05-10T09:26:04Z

Looks good. thanks for sharing the tips.

How shall I use an icon with two fa classes. for example:  <i class="fa-regular fa-building-columns"></i>



> So you just want to put a picture/icon instead of a box ?
> 
> Tip: You could also use fontawesome icons and shapes: <img alt="image" width="653" src="https://user-images.githubusercontent.com/33425497/75097357-3f1eb600-55aa-11ea-9188-e03b2282c5f8.png">
> 
> https://mermaid-js.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoiZ3JhcGggVERcbiAgQiAtLT4gQ3tMZXQgbWUgdGhpbmt9XG4gIEMgLS0-fE9uZXwgRFtMYXB0b3BdXG4gIEMgLS0-fFR3b3wgRVtpUGhvbmVdXG4gIEMgLS0-fFRocmVlfCBGWyhmYTpmYS1kYXRhYmFzZSBEYXRhYmFzZSldXG5cdFx0IiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifSwidXBkYXRlRWRpdG9yIjpmYWxzZX0



### rgonzalez028 commented on 2022-07-22T00:34:46Z

from https://community.home-assistant.io/t/live-network-diagram-influxdb-grafana-mermaid/100956 I cleaned the text a bit and here's a more elaborate example: 

https://mermaid-js.github.io/mermaid-live-editor/edit#pako:eNqFlGFr2zAQhv-K0KeW1Y6kkLUNobAloRTSEuIwBvM-yJbWiNmykOWVkuS_75zEdhx76weB7nzvq3tORlscZ0LiMX613GzQehZqlCj9O3DviURC_uJF4pDSTlqTJdxJFPFc5VD1xjX9MYll-elhFiwQJWRACXqOJpF9KBclPuRgMZ9OBqfKn57n2ayA7bYSz8WrXB1S3vczLSP-kJwp93CoMldXlawse1pWgrrs-trzTyeAQOi8rZi9BB9IAIzVYIv1HI3IgLW47gHo851Pe7HA4biBzA74n6MdN7Xfau19mVJGSAd02Hi1LR6jnYlrhuW0O6J70qB0tPmbcvGmbmC98IJHSkbzjg1rNZAX0fGXsFJQiLmBGcU8pXUnU55Ky7vd3NJWN5WQfSxkXaHZZFo28GXUw99zorK16mnVldy1Rya1uGBmZXwYXXOPRjX0q6VCw69d41Hb-MyivEfFLgw-9TjQfzkcmtB_GrKXbz1ot__rIOHGZaY2WBzCnomyy_HgGwy3lnIl4LHYQg6F2G1kKkM8hu3ppQhxqPdQWhgBb8VcKJdZPHa2kDeYFy4L3nVcxceameIw8_SY3P8F0FRzsw

Code:
```
graph TD
 linkStyle default interpolate basis
 wan1[<center>DSL 100/10 Mb<br><br>10.100.102.1</center>]---router{<center>EdgeRouter-X<br><br>10.20.30.1</center>}
 ip((<center><br>IP<br><br></center>))-.-router
 dns((<center><br>DNS<br><br></center>))-.-router
 wan2[<center>LTE 50/20 Mb<br><br>192.168.1.1</center>]---router
 router---|100Mb|ap[<center>RT-AC1200<br><br>10.20.30.3</center>]
 router---|1Gb|pc(<center>PC<br><br>10.20.30.190</center>)
 router---|1Gb|switch[<center>TL-SG105E<br><br>10.20.30.2</center>]
 subgraph red1
 ap-.-cam1(<center>Camera<br><br>10.20.30.171</center>)
 ap-.-cam2(<center>Camera<br><br>10.20.30.172</center>)
 ap-.-phone(<center>Phone<br><br>10.20.30.191</center>)
 ap-.-ir(<center>IR<br><br>10.20.30.180</center>)
 end
 subgraph red2
 switch---|100Mb|pi1(<center>RPi 3B<br><br>10.20.30.150</center>)
 switch---|1Gb|pi2(<center>RPi 3B+<br><br>10.20.30.151</center>)
 switch---|100Mb|nvr(<center>NVR<br><br>10.20.30.170</center>)
 switch---|1Gb|laptop(<center>Laptop<br><br>10.20.30.192</center>)
 end
 ```
 
 This is the rendered chart:
 
 
![image](https://user-images.githubusercontent.com/63331756/180337352-4b2d7c63-c01c-4ce8-9897-4e608794e5b1.png)


### kriskeillor commented on 2022-09-09T17:52:17Z

This is a great discussion.

I really appreciate you linking those other resources @jgroom33 (diagrams.mingrammer, drawthenet). 
As well as the relevant issues linked and the other feature ideas (might be worth opening a new issue).
Somewhere in the rabbit hole this [LibreOffice IT art pack](https://extensions.libreoffice.org/en/extensions/show/vrt-network-equipment) was shared, which is quite stellar actually.

I think its important to remember that network topologies are meant to **describe networks**. Mermaid does this visually. [NetJSON](https://github.com/netjson/netjson) describes the actual features of a network, such as "network configuration of devices, monitoring data, routing information, and network topology". However, NetJSON has pretty weak visualization tools. Their docs link to [openwisp-network-topology](https://github.com/openwisp/openwisp-network-topology/) as one implementation, but personally I don't really like the organic layout and it's really lacking the crispness of mermaid and other examples shared here (@justyn's is particularly good, and IP addressing individual connections is another awesome feature). I would prefer a non- or semi-hierarchical layout as others discussed. There's also [netjsongraph.js](https://github.com/openwisp/netjsongraph.js) which seems decent although (a) the site hosting the examples, nodeshot.org, is down (apparently just for me) and (b) it also seems to be organic-only, and I don't see those fancy router/switch/PC/etc. symbols we all know and love.

But back to my point, it seems the best tool to define networks is the well-established NetJSON, and Mermaid should be used to visually describe them. After all it's a diagramming tool, not a mapping tool. A utility to process NetJSON into Mermaid would be really useful. It would still require the new diagram type as described here, in #806 , #867, #1527, etc.

edit: [Additional NetJSON visualizers](https://netjson.org/docs/implementations.html#network-topology-visualizers), would be great to see Mermaid (or a Mermaid utility, rather) on this list one day.

---

For fun, I've [attached a network topology design](https://github.com/mermaid-js/mermaid/files/9537724/2022-09-09-IT_Topology_Redacted.pdf) (pdf) I made in Mermaid.
I'm happy with it but there are a lot of issues.
1. It doesn't look anything like a standard IT diagram, reducing perceived professionalism and ease of comprehension.
2. The actual network topology is intermixed with visual data in the source.
3. Sometimes the visualization 'breaks'. Not talking about a bug, its just ordered in a way I don't like and I feel forced to redefine the topology to create an easy-to-follow visual. In some ways I think this is beneficial, because it forces me to reconsider decisions and often the prettier topology seems the more effective. But sometimes it's just a weird mermaid hiccup.

I plan to transition to NetJSON to describe this network as it, and the level of detail required, grow. I'll keep everyone posted on visualization efforts.

### go2null commented on 2023-03-02T13:29:25Z

related: https://github.com/mermaid-js/mermaid/issues/1652 "Labels on edge connections"

### CWempe commented on 2023-04-01T15:53:09Z

I want to support @justyn regarding the need to define ip addresses to interfaces rather than devices.
There should even be a way to lable an interface (e.g. `eth0`, `Fa0/12` `Ethernet 1`).

like this:
![image](https://user-images.githubusercontent.com/1270359/229299594-2a58e0f7-5571-4b00-8f1d-0ad28c2ae44b.png)



### giosueDelgado commented on 2023-09-12T09:57:37Z

I'm interested also

### AkechiShiro commented on 2023-09-12T12:35:04Z

Could you please refrain from putting comments on interest and please react to already existing comments @giosueDelgado, you're notifying everyone about something, that doesn't make this issue move in any way forward.

Btw, I'm interested to work on this if possible, any new progress @kriskeillor ? Was any of the work you discussed done ? Or is being still worked on ? If so where, is there any PRs? Draft PRs ? Forks ?



Fix this issue. Use the tools given to help #search #resolve-library-id #get-library-docs 

Don't come back to me until it has been fully implemented and fully tested. Make sure there are no mistakes

MAke sure to think through all the elements, nodes and other things and to add icons for it. THey use https://icones.js.org/ for it. 

Here is the page for adding diagram types: https://mermaid.js.org/community/new-diagram.html #fetch_content 