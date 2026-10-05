# 海賊新時代：Blender 地標匯出腳本（在 Blender 的 Scripting 分頁開啟後按「執行」）
# 命名規則：
#   COL_xxx   → 會擋人的牆（遊戲裡看不到，只做碰撞）
#   PLAT_xxx  → 可以站上去的地板／樓梯平台（遊戲裡看不到，只做碰撞）
#   其他物件   → 看得到的模型
# 單位：1 Blender 公尺 ＝ 遊戲 1 單位；角色身高約 1.8。模型原點放在地標底部中心。
import bpy, os, json
out_dir = bpy.path.abspath('//')            # 和 .blend 檔放在同一個資料夾
name = bpy.path.basename(bpy.data.filepath).rsplit('.', 1)[0] or 'landmark'
cols, plats, warn = [], [], []
for o in bpy.context.scene.objects:
    if o.type != 'MESH':
        continue
    if o.rotation_euler.z % 1.5708 > 1e-3 and (o.name.startswith('COL_') or o.name.startswith('PLAT_')):
        warn.append(f'{o.name} 有旋轉：遊戲的碰撞只支援和 x／z 軸對齊的方塊')
    bb = [o.matrix_world @ __import__('mathutils').Vector(c) for c in o.bound_box]
    xs, ys, zs = [v.x for v in bb], [v.y for v in bb], [v.z for v in bb]
    box = [round(min(xs), 2), round(-max(ys), 2), round(max(xs), 2), round(-min(ys), 2), round(min(zs), 2), round(max(zs), 2)]  # Blender Y → 遊戲 -Z
    if o.name.startswith('COL_'): cols.append(box)
    elif o.name.startswith('PLAT_'): plats.append(box)
# 只匯出看得到的物件
for o in bpy.context.scene.objects: o.select_set(not (o.name.startswith('COL_') or o.name.startswith('PLAT_')))
bpy.ops.export_scene.gltf(filepath=os.path.join(out_dir, name + '.glb'), export_format='GLB', use_selection=True,
                          export_apply=True, export_draco_mesh_compression_enable=True, export_yup=True)
json.dump({'walls': cols, 'plats': plats}, open(os.path.join(out_dir, name + '.collide.json'), 'w'), ensure_ascii=False, indent=1)
print('完成：', name + '.glb', f'牆 {len(cols)} 個、地板 {len(plats)} 個'); [print('提醒：', w) for w in warn]
