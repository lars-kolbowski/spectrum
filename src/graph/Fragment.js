//		a spectrum viewer
//
//      Copyright  2015 Rappsilber Laboratory, Edinburgh University
// 
// 		Licensed under the Apache License, Version 2.0 (the "License");
// 		you may not use this file except in compliance with the License.
// 		You may obtain a copy of the License at
// 
// 		http://www.apache.org/licenses/LICENSE-2.0
//
//   	Unless required by applicable law or agreed to in writing, software
//   	distributed under the License is distributed on an "AS IS" BASIS,
//   	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   	See the License for the specific language governing permissions and
//   	limitations under the License.
//
//		author: Colin Combe
//		
//		graph/Fragment.js

function Fragment (fragment){
	this.name = fragment.name.trim();
	this.peptideId = fragment.peptideId;
	this.sequence = fragment.sequence;
	this.range = fragment.range;
	this.class = fragment.class;
	
	var ion = this.name.split('')[0];
	if (ion == 'a' || ion == 'b' || ion == 'c') {
		this.ionType = 'b';
	} else {
		this.ionType = 'y';
	}
	
	var fragRegex = /(.(\d*))/g;
	var regexMatch = fragRegex.exec(this.name);
	this.ionNumber = regexMatch[2] - 0;
    
    this.lossy = false;
    if (this.name.indexOf("_") != -1){
		this.lossy =true;
	}
}
