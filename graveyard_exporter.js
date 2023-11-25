(function () {
    let menuButton;
	var outfileText = "";
    Plugin.register("graveyard_exporter", {
        title: "Graveyard Model Format Exporter",
        author: "CAPPIN",
        description:
            "Converts Blockbench models to the Graveyard animation format, used by CLINKER.",
        icon: "line_style",
        version: "1.0.0",
        variant: "both",
        about:
            ": )",
        tags: ["Minecraft: Java Edition"],
        onload() {
            menuButton = new Action("export_model_to_java", {
                name: "Export Graveyard Model",
                description: "Exports model to Graveyard java code",
                icon: "line_style",
                condition: () => true,
                click() {
                    mapToExport();
                },
            });
            MenuBar.addAction(menuButton, "file.export");
        },
        onunload() {
            menuButton.delete();
        },
    });

    function mapToExport() {
        new Dialog("model_name", {
            id: "model_name",
            title: "Set Model Attributes",
            form: {
				name: {
					label: "Model Name",
					type: "text",
					default: "Model"
				},
            },
            onConfirm(form) {
				console.log(this.getFormResult());
                let data = generateFile(this.getFormResult().name);
                Blockbench.export({
                    type: "Java File",
                    extensions: ["java"],
                    savetype: "text",
                    content: data,
                });
                this.hide();
            },
        }).show();
    }

    function generateFile(modelName) {
		outfileText = "";
		let className = modelName + "SkeletonFactory";
		let groups = Group.all;
		let cubes = Cube.all;







		outfileText += "import foundry.veil.model.graveyard.render.mesh.ModelMesh;\n";
		outfileText += "import foundry.veil.model.graveyard.render.mesh.StaticMesh;\n";
		outfileText += "import foundry.veil.model.graveyard.update.AnimationProperties;\n";
		outfileText += "import birsy.clinker.client.model.base.SkeletonFactory;\n";
		outfileText += "import foundry.veil.model.graveyard.update.InterpolatedBone;\n";
		outfileText += "import foundry.veil.model.graveyard.update.InterpolatedSkeleton;\n";
		outfileText += "import foundry.veil.model.graveyard.update.constraint.Constraint;\n";
		outfileText += "import org.joml.Quaternionf;\n";
        outfileText += "\n";
		
		outfileText += "public class " + className + " implements SkeletonFactory {\n";
		outfileText += "	private final ModelMesh[] meshes = new ModelMesh[" + groups.length + "];\n";
		outfileText += "	\n";
		outfileText += "	public " + className + "() {\n";
		outfileText += "		int texWidth = " + Texture.getDefault().width + ";\n"
		outfileText += "		int texHeight = " + Texture.getDefault().height + ";\n"

		for (let i = 0; i < groups.length; i++) {
			let group = groups[i];
			outfileText += "		StaticMesh mesh" + i + " = new StaticMesh(texWidth, texHeight);\n"
			for (var child of group.children) {
				let origin = group.origin;
				
				if (child.type == "Cube" || child.type == "cube") {
					let f = child.from;
					let t = child.to;
					
					let xSize = t[0] - f[0];
					let ySize = t[1] - f[1];
					let zSize = t[2] - f[2];
					
					let xOffset = f[0] - origin[0];
					let yOffset = f[1] - origin[1];
					let zOffset = f[2] - origin[2];

					let uvOffset = child.uv_offset;
					let meshText = "mesh" + i + ".addCube(" + xSize + "F, " + ySize + "F, " + zSize + "F, " + xOffset + "F, " + yOffset + "F, " + zOffset + "F, " + child.inflate + "F, " + child.inflate+ "F, " + child.inflate+ "F, " + uvOffset[0] + "F, " + uvOffset[1] + "F, " + child.mirror_uv + ")";
					
					let rot = child.rotation;
					let rotX = rot[0] * 0.01745329251;
					let rotY = rot[1] * 0.01745329251;
					let rotZ = rot[2] * 0.01745329251;
					let isRotated = !(rotX == 0 && rotY == 0 && rotZ == 0);
					
					outfileText += "		" + meshText + ";\n";

					if (isRotated) {
						//outfileText += "		StaticMesh.rotate(" + origin[0] + "F, " + origin[1] + "F, " + origin[2] + "F, \n			" + meshText + ",\n			new Quaternionf().rotationZYX(" + rotZ + "F, " + rotY + "F, " + rotX + "F));\n";
					} else {
						//outfileText += "		" + meshText + ";\n";
					}
					
				} else if (child.type == "Mesh" || child.type == "mesh") {
					let addFace = function(face, key) {		
						let normal = face.getNormal(true)
						outfileText += "		mesh" + i + ".addFace(" + normal[0] + "F, " + normal[1] + "F, " + normal[2] + "F";
						
						for (var vertexID of face.vertices) {
							let vertex = child.vertices[vertexID];
							let uv = face.uv[vertexID];
							let x = vertex[0] - origin[0];
							let y = vertex[1] - origin[1];
							let z = vertex[2] - origin[2];
							outfileText += ", new StaticMesh.FaceVertex(" + x + "F, " + y + "F, " + z + "F, " + uv[0] + "F, " + uv[1] + "F)";
							//outfileText += ", new StaticMesh.FaceVertex(" + x + "F, " + y + "F, " + z + "F, " + uv[0] + "F, " + uv[1] + "F)";
						}
						
						outfileText += ");\n";
					}
					
					child.forAllFaces(addFace);
				}
			}
			
			outfileText += "		meshes[" + i + "] = mesh" + i + ";\n";
			outfileText += "		\n";
		}
		
		outfileText += "	}\n";
		outfileText += "	\n";
		outfileText += "	public InterpolatedSkeleton create() {\n";
		outfileText += "		" + modelName + "Skeleton skeleton = new " + modelName + "Skeleton();\n";
		for (let i = 0; i < groups.length; i++) {
			let group = groups[i];
			let pos = group.origin;
			
			var x = pos[0];
			var y = pos[1];
			var z = pos[2];
			
			if (group.parent.type == "Group" || group.parent.type == "group") {
				let parentPos = group.parent.origin;
				x = pos[0] - parentPos[0];
				y = pos[1] - parentPos[1];
				z = pos[2] - parentPos[2];
			}
			
			let rot = group.rotation;
			outfileText += "		InterpolatedBone " + group.name + "Bone = new InterpolatedBone(\"" + group.name + "\");\n";
			outfileText += "		" + group.name + "Bone.setInitialTransform(" + x + "F, " + y + "F, " + z + "F, new Quaternionf().rotationZYX(" + rot[2] * 0.01745329251 + "F, " + rot[1] * 0.01745329251 + "F, " + rot[0] * 0.01745329251 + "F));\n";
			outfileText += "		skeleton.addBone(" + group.name + "Bone, meshes[" + i + "]);\n";
			outfileText += "		skeleton." + group.name + " = " + group.name + "Bone;\n";
			outfileText += "		\n";
		}
		for (var group of groups) {
			for (var child of group.children) {
				if (child.type == "Group" || child.type == "group") {
					outfileText += "		" + group.name + "Bone.addChild(" + child.name + "Bone);\n"
				}
			}
		}
		
		outfileText += "		skeleton.buildRoots();\n";
		outfileText += "		return skeleton;\n";
		outfileText += "	}\n";
		outfileText += "	\n";
		outfileText += "	public static class " + modelName + "Skeleton extends InterpolatedSkeleton {\n"
		for (let i = 0; i < groups.length; i++) {
			let group = groups[i];
			outfileText += "		protected InterpolatedBone " + group.name + ";\n"
		}
		outfileText += "		\n";
		outfileText += "		@Override\n";
        outfileText += "		public void animate(AnimationProperties properties) {\n";
		outfileText += "			\n";
		outfileText += "		}\n";
		outfileText += "	}\n";
		outfileText += "}";

        return outfileText;
    }
})();