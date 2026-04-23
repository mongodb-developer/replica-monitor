1. Wire up read/write concerns / ~~read preferences~~
2. ~~Wire up zone sharding~~
3. ~~Add pop-up explanations of what each action is doing in the background.~~
4. Check behaviour of direct connection to shard from workload app during a data center network outage.
5. Check behaviour of direct connection to shard from workload app when replica set is read-only due to lack of quorum (is host list getting maintained correctly?)
6. ~~When saving zones, if the zone name is invalid, the message is shown on the main form status and is very easy to miss.~~
7. ~~Only show 'Shard Data' when cluster is sharded.~~ Maybe rename 'zone data?'
8. ~~Make display of interface elements selectable to use screen space more effectively.~~
9. ~~When switching to a sharded cluster with workload running in US data center with nodes only in US, initially latency wos 220ms. Eventually it switched to local latency, but it took a while.~~
10. ~~Last Read Value is rotating between values read from all connections when we have sharded cluster - should only be value from mongos.~~
11. ~~Read zone configuraton data form sh.status each time the dialog box is opened rather than read it from file.~~ 
12. Idea from Scott Amerman - simulate multiple users in different locations - show activity levels on each shard / zone.
13. ~~Add Global Map display with activity~~ 
14. ~~Add India and EU data centers~~ 
15. Allow primary shard to be selected.
16. ~~Verify, if there are multiple replica sets, does changing the election timeout setting update them all?~~
17. ~~When using read preference nearest or secondary, it takes a long time (30+sec) for the driver to switch to another node if the nearest node is network disconnected.~~
18. Check behaviour when a shard is included in multiple zones, or a zone includes multiple shards.
19. Check behaviour when multiple zones are in a single data center.
20. ~~Add option to collapse Workload console horizontally. Expand Replica Topolgy view to use addional space when available. Dynamically rezine nodes so no overlap with reduced canvas.~~
21. Review application font sizes to make better use of available space
22. Review application titles.
23. ~~Rename default containers.~~
24. ~~Improve Zone definition modal~~ 
25. ~~Add UI safeguards - don't allow a new activity to be started until the prior activitiy has been safely completed.~~
26. Review help topics for completeness / correctness.
27. ~~Add a "template" system to allow the initial configuration to be defined. Allow multiple templates to be created. The templates should allow data centers, nodes, shards, and zones to be defined, and system should default set up to this whenever a template is selected.~~
28. Review and correct slow performance of startup, initial sharding, and app server relocation. 
29. When the app server is in the same data center as a read-only node, and the rest of the replica set is in another data center (unsharded replica set), if using read preference 'nearest', there's a 35 second delay from a network disconnect to to reads being redirected to another node.
30. ~~When doing a data center failure with a sharded cluster, after a couple of seconds, the data center network failure red hashing disappears and each node is shown as individually failed. After recovering each node, the networking seems messed up. In the test case I ran, the app server was in the same data center that was network-failed. After recovery, the config and application servers were still in the correct data center network, but had not been reconnected to the intra / inter region networks.~~
31. ~~On startup, default nodes are being listed in network-ip-allocations.json in the application server data center, even if that is different from their actual data center. Doesn't happen every time, and I'm struggling to reproduce it. Likely doesn't do any harm in any case.~~
32. Review template format and check invalid configurations are detected and rejected.
33. ~~Update template selection modal desing to be a bit more appealing.~~ 
34. ~~Verify what happens when you shard an initially unsharded replica se.~~
35. ~~Test consolidated mode.~~
36. ~~Move to having one application server per data center, using consolidated mode exclusively. Check networking (dedicated network for sharing mongod instance, and that all mongos instances are configured to point to the same monogd). Verify application server move functionality for both unsharded and sharded deployments, before and after nodes are added, and after transitioning from unsharded to sharded.~~
37. ~~Add the ability to save configurations.~~
38. ~~When changing settings, when you choose a write concern, something is setting it back to the prior value before you get a chance to save the settings. Same with "show shard names" setting.~~
39. When converting from RS to Sharded, workload app needs to be restarted to connect to MongoS.
40. ~~Check behaviour of data center netowrk disconnects / reconnects in sharded clusters~~
41. ~~RS to sharded process is currently failing.~~
42. Deploy to Instruqt
43. Be aware, in Sharded deployments, direct connections to replica sets seem to fail if the replic set is not 100% healthy 
44. ~~Generate new architect day certificates.~~
45. Check how docker is installed on Instruqt VMs - switch from snap to offical apt repo tp avoid apparmor derived permission errors when trying to manually stop containers (https://medium.com/@stephenoroy/troubleshooting-docker-resolving-permission-issues-and-stopping-containers-21a4fff27cfc)
