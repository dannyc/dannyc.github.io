		traverseDoublebookingGraph : function(parentId, associatedIds, results, callback){ //function that traverses a graph data structure.
			//Since every assignment only knows which other assignments it overlaps with- but does not know which assignments it's overlapped assignments overlap with
			//for example if A overlaps with B, and C overlaps with B, but A and C do not overlap. Need to know get to C starting with A by traversing the associated
			//double booked assignmnets id's. This is a classic Computer Science "graph" data structure.
			//The implementation is a little tricky since assignments can only be loaded asynchrounously, so we can't do a standard while loop to go through our
			//queue. Instead this is done using recursion. We pass the queue along for the ride along with a list of already visited nodes (assignments) so
			//we don't traverse the same path twice and end up with an endless loop. Finally, when the queue is empty call the callback with the results
			//This function does the following-
			//Traverses though every associated double booked assignment, by checking each double booked assignment and seeing what it's double booked with
			//It then:
			//1) stores every assignment node id in an array
			//2) determines which node (assignment) has the earliest start time
			//3) determines which node (assignment) has the latest end time
			//put those valuse into a results object and returns them to the callback
			if(results.visitedIds.indexOf(parentId) < 0){ //have we NOT gone down this route already (should always be true)
				results.visitedIds.push(parentId); //mark it as visited
				if(associatedIds.length > 0){ //should always be true
					var assignmentId = associatedIds.shift(); //take the first item out of our queue
					assignmentDB.getAssignmentById(assignmentId).then(function(assignment){ //async! the is the reason why we need a callback :(
						if(assignment.dateFrom < results.earliest.dateFrom){ //does this assignment start earlier than the our current champion
							results.earliest.dateFrom = assignment.dateFrom;
							results.earliest.id = String(assignment.id);
						}
						if(assignment.dateTo > results.latest.dateTo){ //does this assignment end after than the our current champion
							results.latest.dateTo = assignment.dateTo;
							results.latest.id = String(assignment.id);
						}
						var doublebookedIds = assignment.doublebooked.split(",");
						for(var i = 0,l = doublebookedIds.length; i < l; i++){
							var doublebookedId = doublebookedIds[i];
							if(results.visitedIds.indexOf(doublebookedId) < 0){ //have we NOT gone down this route already
								associatedIds.push(doublebookedId); //add it to the queue
							}
						}
					}).catch(function (error) { //if the promise fails
						console.error(error.message);
					}).finally(function(){
						if(associatedIds.length == 0){ //we've finished traversing, the queue is empty
							if(results.visitedIds.indexOf(assignmentId) < 0){ //has our last id been marked as visited yet?
								results.visitedIds.push(assignmentId); //add this final node
							}
							callback(results); //since the DB is async- can't use "return" instead use a callback
						}else{
							assignmentModule.utils.traverseDoublebookingGraph(assignmentId, associatedIds, results, callback); //call recursively until the queue is empty
						}
					});
				}//END if assicated not empty
			} //END if visited before
		},//END function
		traverseDoublebookingGraph2 : function(firstAssignment, associatedIds, assignments){ //traversal without async
			var results = { //object that will be passed around- and finally send to callback
					allIds : [String(firstAssignment.id)], //full list of all nodes. (also keeps tracks of nodes that we have already traversed)
					earliestDate : firstAssignment.dateFrom, //the double booked assignment that starts the earliest
					latestDate : firstAssignment.dateTo //the double booked assignment that ends the latest
				};
			while(associatedIds && associatedIds.length > 0){ //loop until we've traversed the whole double booked graph
				var assignmentId = associatedIds.shift(); //take the first item out of our queue
				if(results.allIds.indexOf(assignmentId) < 0){ //have we NOT gone down this route already
					results.allIds.push(assignmentId); //we are now going down it- so add it to the list of visited
					var assignment = assignments[assignmentId];
					if(assignment.dateFrom < results.earliestDate){ //does this assignment start earlier than the our current champion
						results.earliestDate = assignment.dateFrom;
					}
					if(assignment.dateTo > results.latestDate){ //does this assignment end after than the our current champion
						results.latestDate = assignment.dateTo;
					}
					//continue to traverse the graph by adding to queue more assignments if needed
					var doublebookedIds = assignment.doublebooked.split(","); //this assignments own related nodes
					for(var i = 0,l = doublebookedIds.length; i < l; i++){
						var doublebookedId = doublebookedIds[i];
						if(results.allIds.indexOf(doublebookedId) < 0 && associatedIds.indexOf(doublebookedId) < 0){ //have we NOT gone down this route already, and not already in the queue
							associatedIds.push(doublebookedId); //add it to the queue
						}
					}
				}
			}
			return results;
		}