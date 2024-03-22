import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export function OrgModel4(props) {
    const { nodes, materials } = useGLTF('/Models/Organic4.glb')
    const newMat = new THREE.MeshStandardMaterial(materials['default.002'])
    newMat.envMapIntensity = 0.3
    console.log(newMat.envMap)
    return (
      <group {...props} dispose={null}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_3.geometry}
          material={newMat}
          position={[2.152, 0, 0.475]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={0.008}
        />
      </group>
    )
  }
  
  useGLTF.preload('/Models/Organic4.glb')